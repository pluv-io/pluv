import type {
    CreateRoomOptions,
    EnterRoomParams,
    MergeEvents,
    PluvClient,
    PluvRoom,
    PluvRoomAddon,
    PluvRouter,
    PluvRouterEventConfig,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import { MockedRoom } from "@pluv/client";
import type {
    AbstractCrdtDocFactory,
    InferCrdtJson,
    InferDoc,
    InferStorage,
    NoopCrdtDocFactory,
} from "@pluv/crdt";
import type {
    Id,
    InferIOInput,
    InferIOOutput,
    IOEventMessage,
    IOLike,
    JsonObject,
    RoomLike,
    UpdateMyPresenceAction,
} from "@pluv/types";
import fastDeepEqual from "fast-deep-equal";
import type { Dispatch } from "react";
import {
    createContext,
    memo,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import {
    identity,
    shallowArrayEqual,
    useAsyncQueue,
    useDeepAsyncMemo,
    useRerender,
    useSyncExternalStoreWithSelector,
} from "./internal";
import type {
    BroadcastProxy,
    CreateBundle,
    EventProxy,
    MockedRoomProviderProps,
    PluvProviderProps,
    PluvRoomProviderProps,
    SubscriptionHookOptions,
} from "./types";

export type CreateBundleOptions<
    TIO extends IOLike<any>,
    TMetadata extends JsonObject = {},
    TPresence extends Record<string, any> = {},
    TCrdt extends AbstractCrdtDocFactory<any, any> = NoopCrdtDocFactory,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
> = {
    addons?: readonly PluvRoomAddon<TIO, TMetadata, TPresence, TCrdt>[];
    router?: PluvRouter<TIO, TPresence, InferStorage<TCrdt>, TEvents>;
};

export const createBundle = <
    TIO extends IOLike<any, any>,
    TMetadata extends JsonObject = {},
    TPresence extends Record<string, any> = {},
    TCrdt extends AbstractCrdtDocFactory<any, any> = NoopCrdtDocFactory,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
>(
    client: PluvClient<TIO, TPresence, TCrdt, TMetadata>,
    options: CreateBundleOptions<TIO, TMetadata, TPresence, TCrdt, TEvents> = {},
): CreateBundle<TIO, TMetadata, TPresence, TCrdt, TEvents> => {
    /**
     * !HACK
     * @description We'll let the context error out if client is not provided,
     * and let the users deal with it.
     * @date October 27, 2022
     */
    const PluvContext = createContext<PluvClient<TIO, TPresence, TCrdt, TMetadata>>(null as any);

    /**
     * !HACK
     * @description We'll let the context error out if the room is not provided,
     * and let the users deal with it.
     * @date November 11, 2022
     */
    const PluvRoomContext = createContext<
        RoomLike<TIO, InferDoc<TCrdt>, TPresence, InferStorage<TCrdt>, TEvents>
    >(null as any);

    const MockedRoomContext = createContext<RoomLike<
        TIO,
        InferDoc<TCrdt>,
        TPresence,
        InferStorage<TCrdt>,
        TEvents
    > | null>(null);

    const MockedRoomProvider = memo<MockedRoomProviderProps<TIO, TPresence, TCrdt>>((props) => {
        const { children, events, initialPresence, initialStorage, room: _room } = props;

        const [room] = useState<MockedRoom<TIO, TPresence, TCrdt, TEvents>>(() => {
            return new MockedRoom<TIO, TPresence, TCrdt, TEvents>(_room, {
                events,
                initialPresence,
                initialStorage:
                    typeof initialStorage === "function"
                        ? (client._defs.initialStorage?.getFactory(initialStorage) as TCrdt)
                        : client._defs.initialStorage,
            });
        });

        return (
            <MockedRoomContext.Provider value={room}>
                <PluvRoomContext.Provider value={room}>{children}</PluvRoomContext.Provider>
            </MockedRoomContext.Provider>
        );
    });

    MockedRoomProvider.displayName = "MockedRoomProvider";

    const PluvRoomProvider = memo<PluvRoomProviderProps<TIO, TMetadata, TPresence, TCrdt>>(
        (props) => {
            const {
                children,
                connect = true,
                debug,
                initialPresence,
                initialStorage,
                metadata,
                onAuthorizationFail,
                room: _room,
            } = props;

            const queue = useAsyncQueue();
            const rerender = useRerender();
            const mockedRoom = useContext(MockedRoomContext);

            const resolvedMeta = useDeepAsyncMemo(async () => {
                const resolved = await Promise.resolve(
                    typeof metadata === "function" ? metadata() : metadata,
                );

                return !!room.metadata ? room.metadata.parse(resolved) : resolved;
            });

            const [room] = useState<PluvRoom<TIO, TMetadata, TPresence, TCrdt, TEvents>>(() => {
                return client.createRoom(_room, {
                    addons: options.addons,
                    debug,
                    initialPresence,
                    initialStorage:
                        typeof initialStorage === "function"
                            ? client._defs.initialStorage?.getFactory(initialStorage)
                            : client._defs.initialStorage,
                    metadata,
                    onAuthorizationFail,
                    router: options.router,
                } as CreateRoomOptions<TIO, TPresence, TCrdt, TMetadata, TEvents>);
            });

            useEffect(() => {
                const unsubscribe = room.subscribe.connection(() => {
                    rerender();
                });

                return () => {
                    unsubscribe();
                };
            }, [rerender, room]);

            useEffect(() => {
                const leaveRoom = async (): Promise<void> => {
                    await queue.push(
                        client.leave(room).catch((error) => {
                            console.error(error);
                        }),
                    );
                };

                if (!connect) {
                    leaveRoom();
                    return;
                }

                if (!resolvedMeta.isInitialized) {
                    leaveRoom();
                    return;
                }

                const resolved = resolvedMeta.value as TMetadata;

                queue.push(
                    client
                        .enter(room, ...([{ metadata: resolved }] as EnterRoomParams<TMetadata>))
                        .catch(async (error) => {
                            console.error(error);
                            await leaveRoom();
                        }),
                );

                return () => {
                    leaveRoom();
                };
            }, [connect, queue, resolvedMeta.isInitialized, resolvedMeta.value, room]);

            return (
                <PluvRoomContext.Provider value={mockedRoom ?? room}>
                    {children}
                </PluvRoomContext.Provider>
            );
        },
    );

    PluvRoomProvider.displayName = "PluvRoomProvider";

    const PluvProvider = memo<PluvProviderProps>((props) => {
        const { children } = props;

        return <PluvContext.Provider value={client}>{children}</PluvContext.Provider>;
    });

    PluvProvider.displayName = "PluvProvider";

    const useClient = (): PluvClient<TIO, TPresence, TCrdt, TMetadata> => useContext(PluvContext);

    const useRoom = () => {
        const room = useContext(PluvRoomContext);

        if (!room)
            throw new Error(
                "Room could not be found. Component must be wrapped with PluvRoomProvider",
            );

        return room;
    };

    const useBroadcast = (): BroadcastProxy<MergeEvents<TEvents, TIO>> => {
        const room = useRoom();

        const broadcast = useCallback(
            <TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
                event: TEvent,
                data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
            ) => {
                room.broadcast(event, data);
            },
            [room],
        );

        return useMemo((): BroadcastProxy<MergeEvents<TEvents, TIO>> => {
            return new Proxy(broadcast, {
                get(fn, prop) {
                    return (
                        data: Id<
                            InferIOInput<MergeEvents<TEvents, TIO>>[keyof InferIOInput<
                                MergeEvents<TEvents, TIO>
                            >]
                        >,
                    ): void => {
                        return fn(prop as keyof InferIOInput<MergeEvents<TEvents, TIO>>, data);
                    };
                },
            }) as BroadcastProxy<MergeEvents<TEvents, TIO>>;
        }, [broadcast]);
    };

    const useCanRedo = (): boolean => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.storage(onStoreChange),
            [room],
        );

        const getSnapshot = useCallback((): boolean => room.canRedo(), [room]);

        const canRedo = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            identity,
        );

        return canRedo;
    };

    const useCanUndo = (): boolean => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.storage(onStoreChange),
            [room],
        );

        const getSnapshot = useCallback((): boolean => room.canUndo(), [room]);

        const canUndo = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            identity,
        );

        return canUndo;
    };

    const useConnection = <T extends unknown = WebSocketConnection>(
        selector = identity as (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>,
    ): Id<T> => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe.connection(onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getConnection;

        const _selector = useCallback(
            (snapshot: WebSocketConnection) => selector(snapshot) as Id<T>,
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual,
        );
    };

    const useDoc = () => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe.storageLoaded(onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getDoc;

        return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    };

    const useEvent = <TType extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        type: TType,
        callback: (data: Id<IOEventMessage<MergeEvents<TEvents, TIO>, TType>>) => void,
    ): void => {
        const room = useRoom();

        useEffect(() => {
            const unsubscribe = room.subscribe.event(type, callback);

            return () => {
                unsubscribe();
            };
        }, [callback, room, type]);
    };

    const event = new Proxy(
        {},
        {
            get(_, prop) {
                const useProxyEvent = (
                    callback: (
                        data: Id<
                            IOEventMessage<
                                MergeEvents<TEvents, TIO>,
                                keyof InferIOOutput<MergeEvents<TEvents, TIO>>
                            >
                        >,
                    ) => void,
                ): void => {
                    return useEvent(
                        prop as keyof InferIOOutput<MergeEvents<TEvents, TIO>>,
                        callback,
                    );
                };

                return { useEvent: useProxyEvent };
            },
        },
    ) as EventProxy<MergeEvents<TEvents, TIO>>;

    const useMyPresence = <T extends unknown = TPresence>(
        selector = identity as (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ): [Id<T>, Dispatch<UpdateMyPresenceAction<TPresence>>] => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe.myPresence(onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getMyPresence;

        const _selector = useCallback(
            (snapshot: TPresence) => selector(snapshot) as Id<T>,
            [selector],
        );

        const myPresence = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual,
        );

        return [myPresence, room.updateMyPresence];
    };

    const useMyself = <T extends unknown = UserInfo<TIO, TPresence>>(
        selector = identity as (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ): Id<T> | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe.myself(onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getMyself;

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TIO, TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as Id<T>);
            },
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual,
        );
    };

    const useOther = <T extends unknown = UserInfo<TIO, TPresence>>(
        connectionId: string,
        selector = identity as (other: UserInfo<TIO, TPresence>) => T,
        options?: SubscriptionHookOptions<T | null>,
    ): T | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.other(connectionId, onStoreChange),
            [room, connectionId],
        );

        const getSnapshot = useCallback(() => room.getOther(connectionId), [room, connectionId]);

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TIO, TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as T);
            },
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual,
        );
    };

    const useOthers = <T extends unknown = readonly UserInfo<TIO, TPresence>[]>(
        selector = identity as (other: readonly Id<UserInfo<TIO, TPresence>>[]) => T,
        options?: SubscriptionHookOptions<T>,
    ): T => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe.others(onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getOthers;

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            selector as (other: readonly Id<UserInfo<TIO, TPresence>>[]) => T,
            options?.isEqual ??
                ((a, b) => {
                    /**
                     * !HACK
                     * @description Assume the return type will always be an array when this occurs
                     * and do a shallow comparison instead like how standard React dependency
                     * arrays work. This is for performance's sake and may lead to bugs if the
                     * selector doesn't always return an array
                     * @date June 22, 2024
                     */
                    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
                        return shallowArrayEqual(a, b);
                    }

                    return fastDeepEqual(a, b);
                }),
        );
    };

    const useRedo = () => {
        const room = useRoom();

        return room.redo;
    };

    const useStorage = <
        TKey extends keyof InferStorage<TCrdt>,
        TData extends unknown = InferCrdtJson<InferStorage<TCrdt>[TKey]>,
    >(
        key: TKey,
        selector = identity as (data: InferCrdtJson<InferStorage<TCrdt>[TKey]>) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ): [data: TData | null, sharedType: InferStorage<TCrdt>[TKey] | null] => {
        const room = useRoom();
        const rerender = useRerender();

        room.subscribe.storageLoaded(() => {
            rerender();
        });

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.storage(key, onStoreChange),
            [key, room],
        );

        const getSnapshot = useCallback((): InferCrdtJson<InferStorage<TCrdt>[TKey]> | null => {
            return room.getStorageJson(key);
        }, [key, room]);

        const _selector = useCallback(
            (snapshot: InferCrdtJson<InferStorage<TCrdt>[TKey]> | null) => {
                return snapshot === null ? null : selector(snapshot);
            },
            [selector],
        );

        const data = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual,
        );

        const sharedType = room.getStorage(key) ?? null;

        return [data, sharedType];
    };

    const useTransact = () => {
        const room = useRoom();

        return room.transact;
    };

    const useUndo = () => {
        const room = useRoom();

        return room.undo;
    };

    return {
        // components
        MockedRoomProvider,
        PluvProvider,
        PluvRoomProvider,

        // proxies
        event,

        // hooks
        useBroadcast,
        useCanRedo,
        useCanUndo,
        useClient,
        useConnection,
        useDoc,
        useEvent,
        useMyPresence,
        useMyself,
        useOther,
        useOthers,
        useRedo,
        useRoom,
        useStorage,
        useTransact,
        useUndo,
    };
};

import type {
    ClientDefs,
    CreateRoomOptions,
    EnterRoomParams,
    InferClientMetadata,
    InferClientOutput,
    InferClientPresence,
    InferSchemaInput,
    PluvClient,
    PluvRoom,
    PluvRoomAddon,
    PluvRouter,
    PluvRouterEventConfig,
    SetKey,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import { MockedRoom, parsePluvSchema } from "@pluv/client";
import type { InferDoc, InferJson, InferStorage } from "@pluv/crdt";
import type {
    BroadcastProxy,
    Id,
    PublicEventKey,
    RoomError,
    RoomLike,
    RoomStats,
    StorageState,
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
    CreateBundle,
    EventProxy,
    MockedRoomProviderProps,
    PluvProviderProps,
    PluvRoomProviderProps,
    SubscriptionHookOptions,
    UseStorageResult,
} from "./types";

export type CreateBundleOptions<TDefs extends ClientDefs = ClientDefs> = {
    addons?: readonly PluvRoomAddon<any>[];
    router?: PluvRouter<TDefs>;
};

export const createBundle = <
    TDefs extends ClientDefs,
    TEvents extends PluvRouterEventConfig<TDefs> = {},
>(
    client: PluvClient<TDefs>,
    options: CreateBundleOptions<SetKey<TDefs, "events", TEvents>> = {},
): CreateBundle<SetKey<TDefs, "events", TEvents>> => {
    type TRoom = SetKey<TDefs, "events", TEvents>;
    type TPresence = InferClientPresence<TRoom>;
    type TMetadata = InferClientMetadata<TRoom>;
    /**
     * !HACK
     * @description We'll let the context error out if client is not provided,
     * and let the users deal with it.
     * @date October 27, 2022
     */
    const PluvContext = createContext<PluvClient<TDefs>>(null as any);

    /**
     * !HACK
     * @description We'll let the context error out if the room is not provided,
     * and let the users deal with it.
     * @date November 11, 2022
     */
    const PluvRoomContext = createContext<
        RoomLike<
            TDefs["io"],
            InferDoc<TDefs["storage"]>,
            TPresence,
            InferStorage<TDefs["storage"]>,
            TEvents,
            InferJson<TDefs["storage"]>
        >
    >(null as any);

    const MockedRoomContext = createContext<RoomLike<
        TDefs["io"],
        InferDoc<TDefs["storage"]>,
        TPresence,
        InferStorage<TDefs["storage"]>,
        TEvents,
        InferJson<TDefs["storage"]>
    > | null>(null);

    const MockedRoomProvider = memo<MockedRoomProviderProps<TRoom>>((props) => {
        const { children, events, initialPresence, initialStorage, room: _room } = props;

        const [room] = useState<MockedRoom<TRoom>>(() => {
            return new MockedRoom<TRoom>(_room, {
                events,
                initialPresence,
                initialStorage,
                storage: client._defs.storage,
            });
        });

        return (
            <MockedRoomContext.Provider value={room}>
                <PluvRoomContext.Provider value={room}>{children}</PluvRoomContext.Provider>
            </MockedRoomContext.Provider>
        );
    });

    MockedRoomProvider.displayName = "MockedRoomProvider";

    const PluvRoomProvider = memo<PluvRoomProviderProps<TRoom>>((props) => {
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

        const createRoom = useCallback((): PluvRoom<TRoom> => {
            return client.createRoom(_room, {
                addons: options.addons,
                debug,
                initialPresence,
                initialStorage,
                metadata,
                onAuthorizationFail,
                router: options.router,
            } as CreateRoomOptions<TRoom>);
        }, [_room, debug, initialPresence, initialStorage, metadata, onAuthorizationFail]);

        const [room, setRoom] = useState(() => createRoom());

        useEffect(() => {
            if (room.id === _room) return;

            setRoom(createRoom());
        }, [_room, createRoom, room]);

        const resolvedMeta = useDeepAsyncMemo(async () => {
            const resolved = await Promise.resolve(
                typeof metadata === "function"
                    ? (
                          metadata as () =>
                              | InferSchemaInput<TDefs["metadata"]>
                              | Promise<InferSchemaInput<TDefs["metadata"]>>
                      )()
                    : metadata,
            );

            return !!room.metadata ? parsePluvSchema(room.metadata, resolved) : resolved;
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
                void leaveRoom();
                return () => {};
            }

            if (!resolvedMeta.isInitialized) {
                void leaveRoom();
                return () => {};
            }

            const resolved = resolvedMeta.value as TMetadata;

            void queue.push(
                client
                    .enter(
                        room,
                        ...([{ metadata: resolved }] as unknown as EnterRoomParams<
                            InferSchemaInput<TDefs["metadata"]>
                        >),
                    )
                    .catch(async (error) => {
                        console.error(error);
                        await leaveRoom();
                    }),
            );

            return () => {
                void leaveRoom();
            };
        }, [connect, queue, resolvedMeta.isInitialized, resolvedMeta.value, room]);

        return (
            <PluvRoomContext.Provider value={mockedRoom ?? room}>
                {children}
            </PluvRoomContext.Provider>
        );
    });

    PluvRoomProvider.displayName = "PluvRoomProvider";

    const PluvProvider = memo<PluvProviderProps>((props) => {
        const { children } = props;

        return <PluvContext.Provider value={client}>{children}</PluvContext.Provider>;
    });

    PluvProvider.displayName = "PluvProvider";

    const useClient = (): PluvClient<TDefs> => useContext(PluvContext);

    const useRoom = () => {
        const room = useContext(PluvRoomContext);

        if (!room)
            throw new Error(
                "Room could not be found. Component must be wrapped with PluvRoomProvider",
            );

        return room;
    };

    const useBroadcast = (): BroadcastProxy<TDefs["io"], TEvents> => {
        const room = useRoom();

        return room.broadcast;
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

    const useConnection = <TValue extends unknown = WebSocketConnection>(
        selector = identity as (connection: WebSocketConnection) => TValue,
        hookOptions?: SubscriptionHookOptions<Id<TValue>>,
    ): Id<TValue> => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.connection(onStoreChange),
            [room],
        );

        const getSnapshot = room.getConnection;

        const _selector = useCallback(
            (snapshot: WebSocketConnection) => selector(snapshot) as Id<TValue>,
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            hookOptions?.isEqual ?? fastDeepEqual,
        );
    };

    const useDoc = () => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                // Storage teardown only surfaces on the connection state, so watch both.
                const unsubscribes = [
                    room.subscribe.storageLoaded(onStoreChange),
                    room.subscribe.connection(onStoreChange),
                ];

                return () => {
                    unsubscribes.forEach((unsubscribe) => {
                        unsubscribe();
                    });
                };
            },
            [room],
        );

        const getSnapshot = room.getDoc;

        return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    };

    const useEvent = <TType extends PublicEventKey<InferClientOutput<TRoom>>>(
        type: TType,
        callback: Parameters<EventProxy<TRoom>[TType]["useEvent"]>[0],
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
                    callback: Parameters<
                        EventProxy<TRoom>[PublicEventKey<InferClientOutput<TRoom>>]["useEvent"]
                    >[0],
                ): void => {
                    return useEvent(prop as PublicEventKey<InferClientOutput<TRoom>>, callback);
                };

                return { useEvent: useProxyEvent };
            },
        },
    ) as EventProxy<TRoom>;

    const useMyPresence = <TValue extends unknown = TPresence>(
        selector = identity as (myPresence: TPresence) => TValue,
        hookOptions?: SubscriptionHookOptions<Id<TValue> | null>,
    ): [Id<TValue>, Dispatch<UpdateMyPresenceAction<TPresence>>] => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.myPresence(onStoreChange),
            [room],
        );

        const getSnapshot = room.getMyPresence;

        const _selector = useCallback(
            (snapshot: TPresence) => selector(snapshot) as Id<TValue>,
            [selector],
        );

        const myPresence = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            hookOptions?.isEqual ?? fastDeepEqual,
        );

        return [myPresence, room.updateMyPresence];
    };

    const useMyself = <TValue extends unknown = UserInfo<TDefs["io"], TPresence>>(
        selector = identity as (myself: Id<UserInfo<TDefs["io"], TPresence>>) => TValue,
        hookOptions?: SubscriptionHookOptions<Id<TValue> | null>,
    ): Id<TValue> | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.myself(onStoreChange),
            [room],
        );

        const getSnapshot = room.getMyself;

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TDefs["io"], TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as Id<TValue>);
            },
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            hookOptions?.isEqual ?? fastDeepEqual,
        );
    };

    const useOther = <TValue extends unknown = UserInfo<TDefs["io"], TPresence>>(
        userId: string,
        selector = identity as (other: UserInfo<TDefs["io"], TPresence>) => TValue,
        hookOptions?: SubscriptionHookOptions<TValue | null>,
    ): TValue | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.other(userId, onStoreChange),
            [room, userId],
        );

        const getSnapshot = useCallback(() => room.getOther(userId), [room, userId]);

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TDefs["io"], TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as TValue);
            },
            [selector],
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            hookOptions?.isEqual ?? fastDeepEqual,
        );
    };

    const useOthers = <TValue extends unknown = readonly UserInfo<TDefs["io"], TPresence>[]>(
        selector = identity as (other: readonly Id<UserInfo<TDefs["io"], TPresence>>[]) => TValue,
        hookOptions?: SubscriptionHookOptions<TValue>,
    ): TValue => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.others(onStoreChange),
            [room],
        );

        const getSnapshot = room.getOthers;

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            selector as (other: readonly Id<UserInfo<TDefs["io"], TPresence>>[]) => TValue,
            hookOptions?.isEqual ??
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

    const useRoomError = (callback: (error: RoomError) => void): void => {
        const room = useRoom();

        useEffect(() => {
            const unsubscribe = room.subscribe.error(callback);

            return () => {
                unsubscribe();
            };
        }, [callback, room]);
    };

    const useRoomStats = <TValue extends unknown = RoomStats>(
        selector = identity as (stats: RoomStats) => TValue,
        hookOptions?: SubscriptionHookOptions<TValue>,
    ): TValue => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.roomStats(onStoreChange),
            [room],
        );

        const getSnapshot = room.getRoomStats;

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            selector as (stats: RoomStats) => TValue,
            hookOptions?.isEqual ?? fastDeepEqual,
        );
    };

    const useStorage = <
        TKey extends keyof InferJson<TDefs["storage"]>,
        TData extends unknown = InferJson<TDefs["storage"]>[TKey],
    >(
        key: TKey,
        selector = identity as (data: InferJson<TDefs["storage"]>[TKey]) => TData,
        hookOptions?: SubscriptionHookOptions<TData | null>,
    ): UseStorageResult<TData, InferStorage<TDefs["storage"]>[TKey]> => {
        const room = useRoom();
        const rerender = useRerender();

        useEffect(() => {
            let storageState: StorageState | null = null;

            const unsubscribes = [
                room.subscribe.storageLoaded(() => {
                    rerender();
                }),
                // `storageLoaded` never fires on teardown, so watch the storage state too.
                room.subscribe.connection(({ storage }) => {
                    if (storage.state === storageState) return;

                    storageState = storage.state;

                    rerender();
                }),
            ];

            return () => {
                unsubscribes.forEach((unsubscribe) => {
                    unsubscribe();
                });
            };
        }, [rerender, room]);

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.subscribe.storage(key, onStoreChange),
            [key, room],
        );

        const getSnapshot = useCallback((): InferJson<TDefs["storage"]>[TKey] | null => {
            return room.getStorageJson(key);
        }, [key, room]);

        const _selector = useCallback(
            (snapshot: InferJson<TDefs["storage"]>[TKey] | null) => {
                return snapshot === null ? null : selector(snapshot);
            },
            [selector],
        );

        const data = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            hookOptions?.isEqual ?? fastDeepEqual,
        );

        const sharedType = room.getStorage(key) ?? null;

        if (data === null || sharedType === null) return [null, null];

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
        useRoomError,
        useRoomStats,
        useStorage,
        useTransact,
        useUndo,
    } as CreateBundle<TRoom>;
};

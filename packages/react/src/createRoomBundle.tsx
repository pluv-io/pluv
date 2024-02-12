import type {
    AbstractRoom,
    MockedRoomEvents,
    PluvClient,
    PluvRoom,
    PluvRoomAddon,
    PluvRoomDebug,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import { MockedRoom } from "@pluv/client";
import type {
    AbstractCrdtDoc,
    AbstractCrdtDocFactory,
    AbstractCrdtType,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import type {
    IOEventMessage,
    IOLike,
    Id,
    InferIOInput,
    InferIOOutput,
    InputZodLike,
    JsonObject,
} from "@pluv/types";
import fastDeepEqual from "fast-deep-equal";
import type { Dispatch, FC, ReactNode } from "react";
import {
    createContext,
    memo,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    identity,
    shallowArrayEqual,
    useRerender,
    useSyncExternalStoreWithSelector,
} from "./internal";

export type CreateRoomBundleOptions<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractCrdtType<any, any>> = {},
> = {
    addons?: readonly PluvRoomAddon<TIO, TPresence, TStorage>[];
    initialStorage: AbstractCrdtDocFactory<TStorage>;
    presence?: InputZodLike<TPresence>;
};

type BaseRoomProviderProps<
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> = {
    children?: ReactNode;
    initialStorage?: keyof TStorage extends never ? never : () => TStorage;
    room: string;
} & (keyof TPresence extends never
    ? { initialPresence?: never }
    : { initialPresence: TPresence });

export type MockedRoomProviderProps<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> = BaseRoomProviderProps<TPresence, TStorage> & {
    events?: MockedRoomEvents<TIO>;
};

export type PluvRoomProviderProps<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> = BaseRoomProviderProps<TPresence, TStorage> & {
    debug?: boolean | PluvRoomDebug<TIO>;
    onAuthorizationFail?: (error: Error) => void;
};

export interface SubscriptionHookOptions<T extends unknown> {
    isEqual?: (a: T, b: T) => boolean;
}

export type UpdateMyPresenceAction<TPresence extends JsonObject> =
    | Partial<TPresence>
    | ((oldPresence: TPresence | null) => Partial<TPresence>);

export interface CreateRoomBundle<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> {
    // components
    MockedRoomProvider: FC<MockedRoomProviderProps<TIO, TPresence, TStorage>>;
    PluvRoomProvider: FC<PluvRoomProviderProps<TIO, TPresence, TStorage>>;

    // hooks
    useBroadcast: () => <TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>,
    ) => void;
    useCanRedo: () => boolean;
    useCanUndo: () => boolean;
    useConnection: <T extends unknown = WebSocketConnection>(
        selector: (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>,
    ) => Id<T>;
    useDoc: () => AbstractCrdtDoc<TStorage>;
    useEvent: <TType extends keyof InferIOOutput<TIO>>(
        type: TType,
        callback: (data: Id<IOEventMessage<TIO, TType>>) => void,
    ) => void;
    useMyPresence: <T extends unknown = TPresence>(
        selector?: (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => [
        myPresence: Id<T>,
        updateMyPresence: Dispatch<UpdateMyPresenceAction<TPresence>>,
    ];
    useMyself: <T extends unknown = UserInfo<TIO, TPresence>>(
        selector?: (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => Id<T> | null;
    useOther: <T extends unknown = UserInfo<TIO, TPresence>>(
        connectionId: string,
        selector?: (other: UserInfo<TIO, TPresence>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => Id<T> | null;
    useOthers: <T extends unknown = UserInfo<TIO, TPresence>>(
        selector?: (other: readonly Id<UserInfo<TIO, TPresence>>[]) => T[],
        options?: SubscriptionHookOptions<readonly Id<T>[]>,
    ) => readonly Id<T>[];
    useRedo: () => () => void;
    useRoom: () => AbstractRoom<TIO, TPresence, TStorage>;
    useStorage: <
        TKey extends keyof TStorage,
        TData extends unknown = InferCrdtStorageJson<TStorage[TKey]>,
    >(
        key: TKey,
        selector?: (data: InferCrdtStorageJson<TStorage[TKey]>) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ) => [data: TData | null, sharedType: TStorage[TKey] | null];
    useTransact: () => (
        fn: (storage: TStorage) => void,
        origin?: string,
    ) => void;
    useUndo: () => () => void;
}

export type InferRoomStorage<
    TRoomBundle extends CreateRoomBundle<any, any, any>,
> =
    TRoomBundle extends CreateRoomBundle<any, any, infer IStorage>
        ? IStorage
        : never;

export const createRoomBundle = <
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractCrdtType<any, any>> = {},
>(
    client: PluvClient<TIO>,
    options: CreateRoomBundleOptions<TIO, TPresence, TStorage>,
): CreateRoomBundle<TIO, TPresence, TStorage> => {
    /**
     * !HACK
     * @description We'll let the context error out if the room is not provided,
     * and let the users deal with it.
     * @author leedavidcs
     * @date November 11, 2022
     */
    const PluvRoomContext = createContext<
        AbstractRoom<TIO, TPresence, TStorage>
    >(null as any);

    const MockedRoomContext = createContext<{
        room: AbstractRoom<TIO, TPresence, TStorage> | null;
    }>({ room: null });

    const MockedRoomProvider = memo<
        MockedRoomProviderProps<TIO, TPresence, TStorage>
    >((props) => {
        const {
            children,
            events,
            initialPresence,
            initialStorage,
            room: _room,
        } = props;

        const [room] = useState<MockedRoom<TIO, TPresence, TStorage>>(() => {
            return new MockedRoom<TIO, TPresence, TStorage>(_room, {
                events,
                initialPresence,
                initialStorage:
                    typeof initialStorage === "function"
                        ? options.initialStorage.getFactory(initialStorage)
                        : options.initialStorage,
                presence: options.presence,
            });
        });

        return (
            <MockedRoomContext.Provider value={{ room }}>
                <PluvRoomContext.Provider value={room}>
                    {children}
                </PluvRoomContext.Provider>
            </MockedRoomContext.Provider>
        );
    });

    MockedRoomProvider.displayName = "MockedRoomProvider";

    const PluvRoomProvider = memo<
        PluvRoomProviderProps<TIO, TPresence, TStorage>
    >((props) => {
        const {
            children,
            debug,
            initialPresence,
            initialStorage,
            onAuthorizationFail,
            room: _room,
        } = props;

        const rerender = useRerender();
        const { room: mockedRoom } = useContext(MockedRoomContext);

        const [room] = useState<PluvRoom<TIO, TPresence, TStorage>>(() => {
            return client.createRoom<TPresence, TStorage>(_room, {
                addons: options.addons,
                debug,
                initialPresence,
                initialStorage:
                    typeof initialStorage === "function"
                        ? options.initialStorage.getFactory(initialStorage)
                        : options.initialStorage,
                presence: options.presence,
                onAuthorizationFail,
            });
        });

        useEffect(() => {
            const unsubscribe = room.subscribe("connection", () => {
                rerender();
            });

            return () => {
                unsubscribe();
            };
        }, [rerender, room]);

        useEffect(() => {
            client.enter(room);

            return () => {
                client.leave(room);
            };
        }, [room]);

        return (
            <PluvRoomContext.Provider value={mockedRoom ?? room}>
                {children}
            </PluvRoomContext.Provider>
        );
    });

    PluvRoomProvider.displayName = "PluvRoomProvider";

    const useRoom = () => useContext(PluvRoomContext);

    const useBroadcast = (): (<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>,
    ) => void) => {
        const room = useRoom();

        return useCallback(
            <TEvent extends keyof InferIOInput<TIO>>(
                event: TEvent,
                data: Id<InferIOInput<TIO>[TEvent]>,
            ) => {
                room.broadcast(event, data);
            },
            [room],
        );
    };

    const useCanRedo = (): boolean => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.storageRoot(onStoreChange),
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
            (onStoreChange: () => void) => room.storageRoot(onStoreChange),
            [room],
        );

        const getSnapshot = useCallback((): boolean => room.canUndo(), [room]);

        const canRedo = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            identity,
        );

        return canRedo;
    };

    const useConnection = <T extends unknown = WebSocketConnection>(
        selector = identity as (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>,
    ): Id<T> => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("connection", onStoreChange);
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

        return room.getDoc();
    };

    const useEvent = <TType extends keyof InferIOOutput<TIO>>(
        type: TType,
        callback: (data: Id<IOEventMessage<TIO, TType>>) => void,
    ): void => {
        const room = useRoom();

        useEffect(() => {
            const unsubscribe = room.event(type, callback);

            return () => {
                unsubscribe();
            };
        }, [callback, room, type]);
    };

    const useMyPresence = <T extends unknown = TPresence>(
        selector = identity as (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ): [Id<T>, Dispatch<UpdateMyPresenceAction<TPresence>>] => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("my-presence", onStoreChange);
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

        const updateMyPresence: Dispatch<UpdateMyPresenceAction<TPresence>> =
            useCallback(
                (value: UpdateMyPresenceAction<TPresence>): void => {
                    const presence =
                        typeof value === "function"
                            ? value(room.getMyPresence())
                            : value;

                    room.updateMyPresence(presence);
                },
                [room],
            );

        return [myPresence, updateMyPresence];
    };

    const useMyself = <T extends unknown = UserInfo<TIO, TPresence>>(
        selector = identity as (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ): Id<T> | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("myself", onStoreChange);
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
        options?: SubscriptionHookOptions<Id<T> | null>,
    ): Id<T> | null => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.other(connectionId, onStoreChange);
            },
            [room, connectionId],
        );

        const getSnapshot = useCallback(
            () => room.getOther(connectionId),
            [room, connectionId],
        );

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

    const useOthers = <T extends unknown = UserInfo<TIO, TPresence>>(
        selector = identity as (
            other: readonly Id<UserInfo<TIO, TPresence>>[],
        ) => T[],
        options?: SubscriptionHookOptions<readonly Id<T>[]>,
    ): readonly Id<T>[] => {
        const room = useRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("others", onStoreChange);
            },
            [room],
        );

        const getSnapshot = room.getOthers;

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            selector as (
                other: readonly Id<UserInfo<TIO, TPresence>>[],
            ) => Id<T>[],
            options?.isEqual ?? shallowArrayEqual,
        );
    };

    const useRedo = () => {
        const room = useRoom();

        return room.redo;
    };

    const useStorage = <
        TKey extends keyof TStorage,
        TData extends unknown = InferCrdtStorageJson<TStorage[TKey]>,
    >(
        key: TKey,
        selector = identity as (
            data: InferCrdtStorageJson<TStorage[TKey]>,
        ) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ): [data: TData | null, sharedType: TStorage[TKey] | null] => {
        const room = useRoom();
        const rerender = useRerender();

        room.subscribe("storage-loaded", () => {
            rerender();
        });

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.storage(key, onStoreChange),
            [key, room],
        );

        const getSnapshot = useCallback((): InferCrdtStorageJson<
            TStorage[TKey]
        > | null => {
            return room.getStorage(key)?.toJson();
        }, [key, room]);

        const _selector = useCallback(
            (snapshot: InferCrdtStorageJson<TStorage[TKey]> | null) => {
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
        PluvRoomProvider,

        // hooks
        useBroadcast,
        useCanRedo,
        useCanUndo,
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

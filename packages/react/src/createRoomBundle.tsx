import type {
    InferYjsSharedTypeJson,
    PluvClient,
    PluvRoomDebug,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import type { PluvRoom } from "@pluv/client";
import type {
    Id,
    InferIOInput,
    InferIOOutput,
    InputZodLike,
    IOEventMessage,
    IOLike,
    JsonObject,
} from "@pluv/types";
import fastDeepEqual from "fast-deep-equal";
import { createContext, Dispatch, FC, ReactNode, useState } from "react";
import { memo, useCallback, useContext, useEffect } from "react";
import type { AbstractType } from "yjs";
import {
    identity,
    shallowArrayEqual,
    useRerender,
    useSyncExternalStoreWithSelector,
} from "./internal";

export interface CreateRoomBundleOptions<
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
> {
    initialStorage?: () => TStorage;
    presence?: InputZodLike<TPresence>;
}

export type PluvRoomProviderProps<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractType<any>>
> = {
    children?: ReactNode;
    debug?: boolean | PluvRoomDebug<TIO>;
    onAuthorizationFail?: (error: Error) => void;
    room: string;
} & (keyof TPresence extends never
    ? { initialPresence?: never }
    : { initialPresence: TPresence }) &
    (keyof TStorage extends never
        ? { initialStorage?: never }
        : { initialStorage?: () => TStorage });

export interface SubscriptionHookOptions<T extends unknown> {
    isEqual?: (a: T, b: T) => boolean;
}

export type UpdateMyPresenceAction<TPresence extends JsonObject> =
    | Partial<TPresence>
    | ((oldPresence: TPresence | null) => Partial<TPresence>);

export interface CreateRoomBundle<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, AbstractType<any>>
> {
    // components
    PluvRoomProvider: FC<PluvRoomProviderProps<TIO, TPresence, TStorage>>;

    // hooks
    usePluvBroadcast: () => <TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>
    ) => void;
    usePluvConnection: <T extends unknown = WebSocketConnection>(
        selector: (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>
    ) => Id<T>;
    usePluvEvent: <TType extends keyof InferIOOutput<TIO>>(
        type: TType,
        callback: (data: Id<IOEventMessage<TIO, TType>>) => void
    ) => void;
    usePluvMyPresence: <T extends unknown = TPresence>(
        selector?: (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ) => [
        myPresence: Id<T> | null,
        updateMyPresence: Dispatch<UpdateMyPresenceAction<TPresence>>
    ];
    usePluvMyself: <T extends unknown = UserInfo<TIO, TPresence>>(
        selector?: (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ) => Id<T> | null;
    usePluvOther: <T extends unknown = UserInfo<TIO, TPresence>>(
        connectionId: string,
        selector?: (other: UserInfo<TIO, TPresence>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ) => Id<T> | null;
    usePluvOthers: <T extends unknown = UserInfo<TIO, TPresence>>(
        selector?: (other: readonly Id<UserInfo<TIO, TPresence>>[]) => T[],
        options?: SubscriptionHookOptions<readonly Id<T>[]>
    ) => readonly Id<T>[];
    usePluvRoom: () => PluvRoom<TIO, TPresence>;
    usePluvStorage: <
        TKey extends keyof TStorage,
        TData extends unknown = InferYjsSharedTypeJson<TStorage[TKey]>
    >(
        key: TKey,
        selector?: (data: InferYjsSharedTypeJson<TStorage[TKey]>) => TData,
        options?: SubscriptionHookOptions<TData | null>
    ) => [data: TData | null, sharedType: TStorage[TKey] | null];
}

export const createRoomBundle = <
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, AbstractType<any>> = {}
>(
    client: PluvClient<TIO>,
    options: CreateRoomBundleOptions<TPresence, TStorage> = {}
): CreateRoomBundle<TIO, TPresence, TStorage> => {
    /**
     * !HACK
     * @description We'll let the context error out if the room is not provided,
     * and let the users deal with it.
     * @author leedavidcs
     * @date November 11, 2022
     */
    const PluvRoomContext = createContext<PluvRoom<TIO, TPresence, TStorage>>(
        null as any
    );

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

        const [room] = useState<PluvRoom<TIO, TPresence, TStorage>>(() => {
            return client.createRoom<TPresence, TStorage>(_room, {
                debug,
                initialPresence,
                initialStorage:
                    typeof initialStorage === "function"
                        ? initialStorage
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
            <PluvRoomContext.Provider value={room}>
                {children}
            </PluvRoomContext.Provider>
        );
    });

    PluvRoomProvider.displayName = "PluvRoomProvider";

    const usePluvRoom = () => useContext(PluvRoomContext);

    const usePluvBroadcast = (): (<TEvent extends keyof InferIOInput<TIO>>(
        event: TEvent,
        data: Id<InferIOInput<TIO>[TEvent]>
    ) => void) => {
        const room = usePluvRoom();

        return useCallback(
            <TEvent extends keyof InferIOInput<TIO>>(
                event: TEvent,
                data: Id<InferIOInput<TIO>[TEvent]>
            ) => {
                room.broadcast(event, data);
            },
            [room]
        );
    };

    const usePluvConnection = <T extends unknown = WebSocketConnection>(
        selector = identity as (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>
    ): Id<T> => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("connection", onStoreChange);
            },
            [room]
        );

        const getSnapshot = room.getConnection;

        const _selector = useCallback(
            (snapshot: WebSocketConnection) => selector(snapshot) as Id<T>,
            [selector]
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual
        );
    };

    const usePluvEvent = <TType extends keyof InferIOOutput<TIO>>(
        type: TType,
        callback: (data: Id<IOEventMessage<TIO, TType>>) => void
    ): void => {
        const room = usePluvRoom();

        useEffect(() => {
            const unsubscribe = room.event(type, callback);

            return () => {
                unsubscribe();
            };
        }, [callback, room, type]);
    };

    const usePluvMyPresence = <T extends unknown = TPresence>(
        selector = identity as (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ): [Id<T> | null, Dispatch<UpdateMyPresenceAction<TPresence>>] => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("my-presence", onStoreChange);
            },
            [room]
        );

        const getSnapshot = room.getMyPresence;

        const _selector = useCallback(
            (snapshot: TPresence | null) => {
                return !snapshot ? null : (selector(snapshot) as Id<T>);
            },
            [selector]
        );

        const myPresence = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual
        );

        const updateMyPresence: Dispatch<UpdateMyPresenceAction<TPresence>> =
            useCallback(
                (value: UpdateMyPresenceAction<TPresence>): void => {
                    const oldMyPresence = room.getMyPresence();
                    const presence =
                        typeof value === "function"
                            ? value(oldMyPresence)
                            : value;

                    room.broadcast(
                        "$UPDATE_PRESENCE" as keyof InferIOInput<TIO>,
                        { presence } as any
                    );
                },
                [room]
            );

        return [myPresence, updateMyPresence];
    };

    const usePluvMyself = <T extends unknown = UserInfo<TIO, TPresence>>(
        selector = identity as (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ): Id<T> | null => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("myself", onStoreChange);
            },
            [room]
        );

        const getSnapshot = room.getMyself;

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TIO, TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as Id<T>);
            },
            [selector]
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual
        );
    };

    const usePluvOther = <T extends unknown = UserInfo<TIO, TPresence>>(
        connectionId: string,
        selector = identity as (other: UserInfo<TIO, TPresence>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>
    ): Id<T> | null => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.other(connectionId, onStoreChange);
            },
            [room, connectionId]
        );

        const getSnapshot = useCallback(
            () => room.getOther(connectionId),
            [room, connectionId]
        );

        const _selector = useCallback(
            (snapshot: Id<UserInfo<TIO, TPresence>> | null) => {
                return !snapshot ? null : (selector(snapshot) as Id<T>);
            },
            [selector]
        );

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual
        );
    };

    const usePluvOthers = <T extends unknown = UserInfo<TIO, TPresence>>(
        selector = identity as (
            other: readonly Id<UserInfo<TIO, TPresence>>[]
        ) => T[],
        options?: SubscriptionHookOptions<readonly Id<T>[]>
    ): readonly Id<T>[] => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => {
                return room.subscribe("others", onStoreChange);
            },
            [room]
        );

        const getSnapshot = room.getOthers;

        return useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            selector as (
                other: readonly Id<UserInfo<TIO, TPresence>>[]
            ) => Id<T>[],
            options?.isEqual ?? shallowArrayEqual
        );
    };

    const usePluvStorage = <
        TKey extends keyof TStorage,
        TData extends unknown = InferYjsSharedTypeJson<TStorage[TKey]>
    >(
        key: TKey,
        selector = identity as (
            data: InferYjsSharedTypeJson<TStorage[TKey]>
        ) => TData,
        options?: SubscriptionHookOptions<TData | null>
    ): [data: TData | null, sharedType: TStorage[TKey] | null] => {
        const room = usePluvRoom();

        const subscribe = useCallback(
            (onStoreChange: () => void) => room.storage(key, onStoreChange),
            [key, room]
        );

        const getSnapshot = useCallback((): InferYjsSharedTypeJson<
            TStorage[TKey]
        > | null => {
            return room.getStorage(key)?.toJSON() ?? null;
        }, [key, room]);

        const _selector = useCallback(
            (snapshot: InferYjsSharedTypeJson<TStorage[TKey]> | null) => {
                return !snapshot ? null : selector(snapshot);
            },
            [selector]
        );

        const data = useSyncExternalStoreWithSelector(
            subscribe,
            getSnapshot,
            getSnapshot,
            _selector,
            options?.isEqual ?? fastDeepEqual
        );

        const sharedType = room.getStorage(key);

        return [data, sharedType];
    };

    return {
        // components
        PluvRoomProvider,

        // hooks
        usePluvBroadcast,
        usePluvConnection,
        usePluvEvent,
        usePluvMyPresence,
        usePluvMyself,
        usePluvOther,
        usePluvOthers,
        usePluvRoom,
        usePluvStorage,
    };
};

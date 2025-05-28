import type {
    MergeEvents,
    MockedRoomEvents,
    PluvClient,
    PluvRoomDebug,
    PluvRouterEventConfig,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import type {
    AbstractCrdtDocFactory,
    InferCrdtJson,
    InferDoc,
    InferInitialStorageFn,
    InferStorage,
} from "@pluv/crdt";
import type {
    CrdtDocLike,
    Id,
    InferIOCrdtKind,
    InferIOInput,
    InferIOOutput,
    IOEventMessage,
    IOLike,
    JsonObject,
    MaybePromise,
    RoomLike,
    UpdateMyPresenceAction,
} from "@pluv/types";
import type { Dispatch, FC, ReactNode } from "react";

export interface PluvProviderProps {
    children?: ReactNode;
}

type BaseRoomProviderProps<
    TPresence extends Record<string, any>,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> = {
    children?: ReactNode;
    initialStorage?: keyof InferStorage<TCrdt> extends never ? never : InferInitialStorageFn<TCrdt>;
    room: string;
} & (keyof TPresence extends never ? { initialPresence?: never } : { initialPresence: TPresence });

export type MockedRoomProviderProps<
    TIO extends IOLike,
    TPresence extends Record<string, any>,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
> = BaseRoomProviderProps<TPresence, TCrdt> & {
    events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
};

export type BroadcastProxy<TIO extends IOLike> = (<TEvent extends keyof InferIOInput<TIO>>(
    event: TEvent,
    data: Id<InferIOInput<TIO>[TEvent]>,
) => void) & {
    [event in keyof InferIOInput<TIO>]: (input: Id<InferIOInput<TIO>[event]>) => void;
};

export type EventProxy<TIO extends IOLike> = {
    [event in keyof InferIOOutput<TIO>]: {
        useEvent: (callback: (data: Id<IOEventMessage<TIO, event>>) => void) => void;
    };
};

export type MetadataGetter<TMetadata extends JsonObject> =
    | TMetadata
    | (() => MaybePromise<TMetadata>);

export type PluvRoomProviderProps<
    TIO extends IOLike<any, any, any>,
    TMetadata extends JsonObject,
    TPresence extends Record<string, any>,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> = BaseRoomProviderProps<TPresence, TCrdt> & {
    connect?: boolean;
    debug?: boolean | PluvRoomDebug<TIO>;
    onAuthorizationFail?: (error: Error) => void;
} & (keyof TMetadata extends never
        ? { metadata?: undefined }
        : { metadata: MetadataGetter<TMetadata> });

export interface SubscriptionHookOptions<T extends unknown> {
    isEqual?: (a: T, b: T) => boolean;
}

export interface CreateBundle<
    TIO extends IOLike<any, any, any>,
    TMetadata extends JsonObject,
    TPresence extends Record<string, any> = {},
    TCrdt extends InferIOCrdtKind<TIO> = InferIOCrdtKind<TIO>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, InferStorage<TCrdt>> = {},
> {
    // components
    MockedRoomProvider: FC<MockedRoomProviderProps<TIO, TPresence, TCrdt>>;
    PluvProvider: FC<PluvProviderProps>;
    PluvRoomProvider: FC<PluvRoomProviderProps<TIO, TMetadata, TPresence, TCrdt>>;

    // proxies
    event: EventProxy<MergeEvents<TEvents, TIO>>;

    // hooks
    useBroadcast: () => BroadcastProxy<MergeEvents<TEvents, TIO>>;
    useCanRedo: () => boolean;
    useCanUndo: () => boolean;
    useClient: () => PluvClient<TIO, TPresence, TCrdt, TMetadata>;
    useConnection: <T extends unknown = WebSocketConnection>(
        selector?: (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>,
    ) => Id<T>;
    useDoc: () => CrdtDocLike<InferDoc<TCrdt>, InferStorage<TCrdt>>;
    useEvent: <TType extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        type: TType,
        callback: (data: Id<IOEventMessage<MergeEvents<TEvents, TIO>, TType>>) => void,
    ) => void;
    useMyPresence: <T extends unknown = TPresence>(
        selector?: (myPresence: TPresence) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => [myPresence: Id<T>, updateMyPresence: Dispatch<UpdateMyPresenceAction<TPresence>>];
    useMyself: <T extends unknown = UserInfo<TIO, TPresence>>(
        selector?: (myself: Id<UserInfo<TIO, TPresence>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => Id<T> | null;
    useOther: <T extends unknown = UserInfo<TIO, TPresence>>(
        connectionId: string,
        selector?: (other: UserInfo<TIO, TPresence>) => T,
        options?: SubscriptionHookOptions<T | null>,
    ) => T | null;
    useOthers: <T extends unknown = readonly UserInfo<TIO, TPresence>[]>(
        selector?: (other: readonly Id<UserInfo<TIO, TPresence>>[]) => T,
        options?: SubscriptionHookOptions<T>,
    ) => T;
    useRedo: () => () => void;
    useRoom: () => RoomLike<TIO, InferDoc<TCrdt>, TPresence, InferStorage<TCrdt>, TEvents>;
    useStorage: <
        TKey extends keyof InferStorage<TCrdt>,
        TData extends unknown = InferCrdtJson<InferStorage<TCrdt>[TKey]>,
    >(
        key: TKey,
        selector?: (data: InferCrdtJson<InferStorage<TCrdt>[TKey]>) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ) => [data: TData | null, sharedType: InferStorage<TCrdt>[TKey] | null];
    useTransact: () => (fn: (storage: InferStorage<TCrdt>) => void, origin?: string) => void;
    useUndo: () => () => void;
}

export type InferBundleRoom<TBundle extends CreateBundle<any, any, any, any, any>> =
    TBundle extends CreateBundle<infer IIO, any, infer IPresence, infer ICrdt, infer IEvents>
        ? RoomLike<IIO, InferDoc<ICrdt>, IPresence, InferStorage<ICrdt>, IEvents>
        : never;

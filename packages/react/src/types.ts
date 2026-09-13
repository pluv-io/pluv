import type {
    InferSchemaInput,
    InferSchemaOutput,
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
    InferDoc,
    InferJson,
    InferSeed,
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
    MaybePromise,
    RoomLike,
    StandardSchemaV1,
    UpdateMyPresenceAction,
} from "@pluv/types";
import type { Dispatch, FC, ReactNode } from "react";

export interface PluvProviderProps {
    children?: ReactNode;
}

/**
 * Storage is all-or-nothing, so a union (not two nullable slots) lets one check narrow both.
 */
export type UseStorageResult<TData extends unknown, TSharedType extends unknown> =
    | [data: null, sharedType: null]
    | [data: TData, sharedType: TSharedType];

type BaseRoomProviderProps<
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> = {
    children?: ReactNode;
    initialStorage?: keyof InferSeed<TCrdt> extends never ? never : InferSeed<TCrdt>;
    room: string;
} & (keyof InferSchemaOutput<TPresenceSchema> extends never
    ? { initialPresence?: never }
    : { initialPresence: InferSchemaInput<TPresenceSchema> });

export type MockedRoomProviderProps<
    TIO extends IOLike,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TEvents extends PluvRouterEventConfig<
        TIO,
        InferSchemaOutput<TPresenceSchema>,
        InferStorage<TCrdt>
    > = {},
> = BaseRoomProviderProps<TPresenceSchema, TCrdt> & {
    events?: MockedRoomEvents<MergeEvents<TEvents, TIO>>;
};

export type BroadcastProxy<TIO extends IOLike> = (<TEvent extends keyof InferIOInput<TIO>>(
    event: TEvent,
    data: Id<InferIOInput<TIO>[TEvent]>,
) => Promise<void>) & {
    [event in keyof InferIOInput<TIO>]: (input: Id<InferIOInput<TIO>[event]>) => Promise<void>;
};

export type EventProxy<TIO extends IOLike> = {
    [event in keyof InferIOOutput<TIO>]: {
        useEvent: (callback: (data: Id<IOEventMessage<TIO, event>>) => void) => void;
    };
};

export type MetadataGetter<TMetadata extends Record<string, any>> =
    | TMetadata
    | (() => MaybePromise<TMetadata>);

export type PluvRoomProviderProps<
    TIO extends IOLike<any, any, any>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> = BaseRoomProviderProps<TPresenceSchema, TCrdt> & {
    connect?: boolean;
    debug?: boolean | PluvRoomDebug<TIO>;
    onAuthorizationFail?: (error: Error) => void;
} & (keyof InferSchemaOutput<TMetadataSchema> extends never
        ? { metadata?: undefined }
        : { metadata: MetadataGetter<InferSchemaInput<TMetadataSchema>> });

export interface SubscriptionHookOptions<T extends unknown> {
    isEqual?: (a: T, b: T) => boolean;
}

export interface CreateBundle<
    TIO extends IOLike<any, any, any>,
    TPresenceSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TCrdt extends AbstractCrdtDocFactory<any, any, any, any> = InferIOCrdtKind<TIO>,
    TMetadataSchema extends StandardSchemaV1<any, any> | undefined = undefined,
    TEvents extends PluvRouterEventConfig<
        TIO,
        InferSchemaOutput<TPresenceSchema>,
        InferStorage<TCrdt>
    > = {},
> {
    // components
    MockedRoomProvider: FC<MockedRoomProviderProps<TIO, TPresenceSchema, TCrdt, TEvents>>;
    PluvProvider: FC<PluvProviderProps>;
    PluvRoomProvider: FC<PluvRoomProviderProps<TIO, TMetadataSchema, TPresenceSchema, TCrdt>>;

    // proxies
    event: EventProxy<MergeEvents<TEvents, TIO>>;

    // hooks
    useBroadcast: () => BroadcastProxy<MergeEvents<TEvents, TIO>>;
    useCanRedo: () => boolean;
    useCanUndo: () => boolean;
    useClient: () => PluvClient<TIO, TPresenceSchema, TCrdt, TMetadataSchema>;
    useConnection: <T extends unknown = WebSocketConnection>(
        selector?: (connection: WebSocketConnection) => T,
        options?: SubscriptionHookOptions<Id<T>>,
    ) => Id<T>;
    useDoc: () => CrdtDocLike<InferDoc<TCrdt>, InferStorage<TCrdt>, InferJson<TCrdt>>;
    useEvent: <TType extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        type: TType,
        callback: (data: Id<IOEventMessage<MergeEvents<TEvents, TIO>, TType>>) => void,
    ) => void;
    useMyPresence: <T extends unknown = InferSchemaOutput<TPresenceSchema>>(
        selector?: (myPresence: InferSchemaOutput<TPresenceSchema>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => [
        myPresence: Id<T>,
        updateMyPresence: Dispatch<UpdateMyPresenceAction<InferSchemaOutput<TPresenceSchema>>>,
    ];
    useMyself: <T extends unknown = UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>>(
        selector?: (myself: Id<UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>>) => T,
        options?: SubscriptionHookOptions<Id<T> | null>,
    ) => Id<T> | null;
    useOther: <T extends unknown = UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>>(
        connectionId: string,
        selector?: (other: UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>) => T,
        options?: SubscriptionHookOptions<T | null>,
    ) => T | null;
    useOthers: <T extends unknown = readonly UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>[]>(
        selector?: (other: readonly Id<UserInfo<TIO, InferSchemaOutput<TPresenceSchema>>>[]) => T,
        options?: SubscriptionHookOptions<T>,
    ) => T;
    useRedo: () => () => void;
    useRoom: () => RoomLike<
        TIO,
        InferDoc<TCrdt>,
        InferSchemaOutput<TPresenceSchema>,
        InferStorage<TCrdt>,
        TEvents,
        InferJson<TCrdt>
    >;
    useStorage: <
        TKey extends keyof InferJson<TCrdt>,
        TData extends unknown = InferJson<TCrdt>[TKey],
    >(
        key: TKey,
        selector?: (data: InferJson<TCrdt>[TKey]) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ) => UseStorageResult<TData, InferStorage<TCrdt>[TKey]>;
    useTransact: () => (fn: (storage: InferStorage<TCrdt>) => void, origin?: string) => void;
    useUndo: () => () => void;
}

export type InferBundleRoom<TBundle extends CreateBundle<any, any, any, any, any>> =
    TBundle extends CreateBundle<infer IIO, infer IPresenceSchema, infer ICrdt, any, infer IEvents>
        ? RoomLike<
              IIO,
              InferDoc<ICrdt>,
              InferSchemaOutput<IPresenceSchema>,
              InferStorage<ICrdt>,
              IEvents,
              InferJson<ICrdt>
          >
        : never;

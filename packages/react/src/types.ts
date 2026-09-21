import type {
    InferClientMetadata,
    InferClientOutput,
    InferClientPresence,
    InferSchemaInput,
    MockedRoomEvents,
    PluvClient,
    PluvRoomDebug,
    SetKey,
    UserInfo,
    WebSocketConnection,
} from "@pluv/client";
import type { ClientDefs } from "@pluv/client";
import type { InferDoc, InferJson, InferSeed, InferStorage } from "@pluv/crdt";
import type {
    BroadcastProxy,
    CrdtDocLike,
    Id,
    IOEventMessage,
    MaybePromise,
    MergeEvents,
    PresenceProcedureProxy,
    PublicEventKey,
    RoomLike,
    RoomError,
    RoomStats,
    StorageProcedureProxy,
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

type BaseRoomProviderProps<TDefs extends ClientDefs> = {
    children?: ReactNode;
    initialStorage?: keyof InferSeed<TDefs["storage"]> extends never
        ? never
        : InferSeed<TDefs["storage"]>;
    room: string;
} & (keyof InferClientPresence<TDefs> extends never
    ? { initialPresence?: never }
    : { initialPresence: InferSchemaInput<TDefs["presence"]> });

export type MockedRoomProviderProps<TDefs extends ClientDefs = ClientDefs> =
    BaseRoomProviderProps<TDefs> & {
        events?: MockedRoomEvents<TDefs>;
    };

/**
 * React event helper (`event.foo.useEvent`). Distinct from `@pluv/types`
 * `EventProxy`, which is `room.subscribe.event`.
 */
export type EventProxy<TDefs extends ClientDefs = ClientDefs> = {
    [event in PublicEventKey<InferClientOutput<TDefs>>]: {
        useEvent: (
            callback: (
                data: Id<IOEventMessage<MergeEvents<TDefs["events"], TDefs["io"]>, event>>,
            ) => void,
        ) => void;
    };
};

export type MetadataGetter<TMetadata extends Record<string, any>> =
    | TMetadata
    | (() => MaybePromise<TMetadata>);

export type PluvRoomProviderProps<TDefs extends ClientDefs = ClientDefs> =
    BaseRoomProviderProps<TDefs> & {
        connect?: boolean;
        debug?: boolean | PluvRoomDebug<TDefs["io"]>;
        onAuthorizationFail?: (error: Error) => void;
    } & (keyof InferClientMetadata<TDefs> extends never
            ? { metadata?: undefined }
            : { metadata: MetadataGetter<InferSchemaInput<TDefs["metadata"]>> });

export interface SubscriptionHookOptions<T extends unknown> {
    isEqual?: (a: T, b: T) => boolean;
}

export interface CreateBundle<
    TDefs extends ClientDefs = ClientDefs,
    TSuspense extends boolean = false,
> {
    // components
    MockedRoomProvider: FC<MockedRoomProviderProps<TDefs>>;
    PluvProvider: FC<PluvProviderProps>;
    PluvRoomProvider: FC<PluvRoomProviderProps<TDefs>>;

    // proxies
    event: EventProxy<TDefs>;

    // hooks
    useBroadcast: () => BroadcastProxy<TDefs["io"], TDefs["events"]>;
    useCanRedo: () => boolean;
    useCanUndo: () => boolean;
    useClient: () => PluvClient<SetKey<TDefs, "events", {}>>;
    useConnection: <TValue extends unknown = WebSocketConnection>(
        selector?: (connection: WebSocketConnection) => TValue,
        options?: SubscriptionHookOptions<Id<TValue>>,
    ) => Id<TValue>;
    useDoc: () => CrdtDocLike<
        InferDoc<TDefs["storage"]>,
        InferStorage<TDefs["storage"]>,
        InferJson<TDefs["storage"]>
    >;
    useEvent: <TType extends PublicEventKey<InferClientOutput<TDefs>>>(
        type: TType,
        callback: Parameters<EventProxy<TDefs>[TType]["useEvent"]>[0],
    ) => void;
    useMyPresence: <TValue extends unknown = InferClientPresence<TDefs>>(
        selector?: (myPresence: InferClientPresence<TDefs>) => TValue,
        options?: SubscriptionHookOptions<Id<TValue> | null>,
    ) => [
        myPresence: Id<TValue>,
        updateMyPresence: Dispatch<UpdateMyPresenceAction<InferClientPresence<TDefs>>>,
    ];
    useMyself: <TValue extends unknown = UserInfo<TDefs["io"], InferClientPresence<TDefs>>>(
        selector?: (myself: Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>>) => TValue,
        options?: SubscriptionHookOptions<Id<TValue> | null>,
    ) => Id<TValue> | null;
    useOther: <TValue extends unknown = UserInfo<TDefs["io"], InferClientPresence<TDefs>>>(
        userId: string,
        selector?: (other: UserInfo<TDefs["io"], InferClientPresence<TDefs>>) => TValue,
        options?: SubscriptionHookOptions<TValue | null>,
    ) => TValue | null;
    useOthers: <
        TValue extends unknown = readonly UserInfo<TDefs["io"], InferClientPresence<TDefs>>[],
    >(
        selector?: (
            other: readonly Id<UserInfo<TDefs["io"], InferClientPresence<TDefs>>>[],
        ) => TValue,
        options?: SubscriptionHookOptions<TValue>,
    ) => TValue;
    usePresence: () => PresenceProcedureProxy<TDefs["treaty"]["_defs"]["procedures"]["presence"]>;
    useRedo: () => () => void;
    useRoom: () => RoomLike<
        TDefs["io"],
        InferDoc<TDefs["storage"]>,
        InferClientPresence<TDefs>,
        InferStorage<TDefs["storage"]>,
        TDefs["events"],
        InferJson<TDefs["storage"]>,
        TDefs["treaty"]
    >;
    useRoomError: (callback: (error: RoomError) => void) => void;
    useRoomStats: <TValue extends unknown = RoomStats>(
        selector?: (stats: RoomStats) => TValue,
        options?: SubscriptionHookOptions<TValue>,
    ) => TValue;
    useStorage: () => StorageProcedureProxy<TDefs["treaty"]["_defs"]["procedures"]["storage"]>;
    useStorageField: <
        TKey extends keyof InferJson<TDefs["storage"]>,
        TData extends unknown = InferJson<TDefs["storage"]>[TKey],
    >(
        key: TKey,
        selector?: (data: InferJson<TDefs["storage"]>[TKey]) => TData,
        options?: SubscriptionHookOptions<TData | null>,
    ) => TSuspense extends true
        ? [data: TData, sharedType: InferStorage<TDefs["storage"]>[TKey]]
        : UseStorageResult<TData, InferStorage<TDefs["storage"]>[TKey]>;
    useTransact: () => (
        fn: (storage: InferStorage<TDefs["storage"]>) => void,
        origin?: string,
    ) => void;
    useUndo: () => () => void;
}

export type InferBundleRoom<TBundle extends CreateBundle<any, any>> =
    TBundle extends CreateBundle<infer TDefs, any>
        ? RoomLike<
              TDefs["io"],
              InferDoc<TDefs["storage"]>,
              InferClientPresence<TDefs>,
              InferStorage<TDefs["storage"]>,
              TDefs["events"],
              InferJson<TDefs["storage"]>,
              TDefs["treaty"]
          >
        : never;

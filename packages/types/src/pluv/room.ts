import type { Subject } from "wonka";
import type { Id, JsonObject } from "../general";
import type { CrdtDocLike, CrdtType, InferCrdtJson } from "./crdt";
import type { ConnectionState, StorageState } from "./enums";
import type {
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutput,
    IOEventMessage,
    IOLike,
    MergeEvents,
    PluvRouterEventConfig,
} from "./shared";

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>> | null;
}

export type OtherSubscriptionCallback<TIO extends IOLike, TPresence extends JsonObject> = (
    value: Id<UserInfo<TIO, TPresence>> | null,
) => void;

export type OtherSubscriptionFn<TIO extends IOLike, TPresence extends JsonObject> = (
    connectionId: string,
    callback: OtherSubscriptionCallback<TIO, TPresence>,
) => () => void;

export type OthersSubscriptionEvent<TIO extends IOLike, TPresence extends JsonObject> =
    | { kind: "clear" }
    | { kind: "enter"; user: Id<UserInfo<TIO, TPresence>> }
    | { kind: "leave"; user: Id<UserInfo<TIO, TPresence>> }
    | { kind: "sync"; users: readonly Id<UserInfo<TIO, TPresence>>[] }
    | { kind: "update"; user: Id<UserInfo<TIO, TPresence>> };

export type OthersSubscriptionCallback<TIO extends IOLike, TPresence extends JsonObject> = (
    value: readonly Id<UserInfo<TIO, TPresence>>[],
    event: OthersSubscriptionEvent<TIO, TPresence>,
) => void;

export type OthersSubscriptionFn<TIO extends IOLike, TPresence extends JsonObject> = (
    callback: OthersSubscriptionCallback<TIO, TPresence>,
) => () => void;

export interface StateNotifierSubjects<TIO extends IOLike, TPresence extends JsonObject> {
    connection: Subject<Id<WebSocketState<TIO>>>;
    "my-presence": Subject<TPresence | null>;
    myself: Subject<Readonly<Id<UserInfo<TIO, TPresence>>> | null>;
    others: Subject<readonly Id<UserInfo<TIO, TPresence>>[]>;
    "storage-loaded": Subject<boolean>;
}

type InferSubjectValue<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
> =
    StateNotifierSubjects<TIO, TPresence>[TSubject] extends Subject<infer IValue>
        ? Id<IValue>
        : never;

export type SubscriptionCallback<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TSubject extends keyof StateNotifierSubjects<TIO, TPresence>,
> = (value: InferSubjectValue<TIO, TPresence, TSubject>) => void;

export type UpdateMyPresenceAction<TPresence extends JsonObject> =
    | Partial<TPresence>
    | ((oldPresence: TPresence | null) => Partial<TPresence>);

export interface UserInfo<TIO extends IOLike, TPresence extends JsonObject = {}> {
    connectionId: string;
    presence: TPresence;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>;
}

export interface WebSocketConnection {
    /**
     * @description How many times a connection attempt was made. This will increment upon each
     * unsuccessful attempt, and will reset upon a successful connection.
     * @date April 13, 2025
     */
    attempts: number;
    id: string | null;
    state: ConnectionState;
}

export interface StorageInfo {
    state: StorageState;
}

export interface WebSocketState<TIO extends IOLike> {
    authorization: AuthorizationState<TIO>;
    connection: WebSocketConnection;
    storage: StorageInfo;
    webSocket: WebSocket | null;
}

export type BroadcastProxy<TIO extends IOLike, TEvents extends PluvRouterEventConfig> = (<
    TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>,
>(
    event: TEvent,
    data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
) => Promise<void>) & {
    [PEvent in keyof InferIOInput<MergeEvents<TEvents, TIO>>]: (
        data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[PEvent]>,
    ) => Promise<void>;
};

export type EventNotifierSubscriptionCallback<
    TIO extends IOLike<any, any>,
    TEvent extends keyof InferIOOutput<TIO>,
> = (value: Id<IOEventMessage<TIO, TEvent>>) => void;

export type EventSubscriptionFn<TIO extends IOLike, TEvents extends PluvRouterEventConfig> = <
    TEvent extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>,
>(
    event: TEvent,
    callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, TEvent>,
) => () => void;

export type EventProxy<
    TIO extends IOLike,
    TEvents extends PluvRouterEventConfig,
> = EventSubscriptionFn<TIO, TEvents> & {
    [PEvent in keyof InferIOOutput<MergeEvents<TEvents, TIO>>]: (
        callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, PEvent>,
    ) => () => void;
};

export type StorageSubscriptionCallback<
    TStorage extends Record<string, CrdtType<any, any>>,
    TKey extends keyof TStorage,
> = (value: InferCrdtJson<TStorage[TKey]>) => void;

export type StorageSubscriptionFn<TStorage extends Record<string, CrdtType<any, any>>> = <
    TKey extends keyof TStorage,
>(
    key: TKey,
    fn: StorageSubscriptionCallback<TStorage, TKey>,
) => () => void;

export type StorageRootSubscriptionCallback<TStorage extends Record<string, CrdtType<any, any>>> =
    (value: { [P in keyof TStorage]: InferCrdtJson<TStorage[P]> }) => void;

export type StorageRootSubscriptionFn<TStorage extends Record<string, CrdtType<any, any>>> = (
    callback: StorageRootSubscriptionCallback<TStorage>,
) => () => void;

export type StorageProxy<TStorage extends Record<string, CrdtType<any, any>>> =
    StorageSubscriptionFn<TStorage> &
        StorageRootSubscriptionFn<TStorage> & {
            [PKey in keyof TStorage]: (
                callback: StorageSubscriptionCallback<TStorage, PKey>,
            ) => () => void;
        };

export type SubscribeFn<TValue extends unknown> = (callback: (value: TValue) => void) => () => void;

export type SubscribeProxy<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
> = (<TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
    name: TSubject,
    callback: SubscriptionCallback<TIO, TPresence, TSubject>,
) => () => void) & {
    connection: SubscribeFn<Id<WebSocketState<TIO>>>;
    event: EventProxy<TIO, TEvents>;
    myPresence: SubscribeFn<TPresence | null>;
    myself: SubscribeFn<Id<UserInfo<TIO>> | null>;
    other: OtherSubscriptionFn<TIO, TPresence>;
    others: OthersSubscriptionFn<TIO, TPresence>;
    storage: StorageProxy<TStorage>;
    storageLoaded: SubscribeFn<boolean>;
};

export interface RoomLike<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig = {},
> {
    id: string;
    broadcast: BroadcastProxy<TIO, TEvents>;
    /**
     * @deprecated To be removed in v3. Use getStorageLoaded instead.
     */
    storageLoaded: boolean;

    canRedo(): boolean;

    canUndo(): boolean;

    getDoc(): CrdtDocLike<TStorage>;

    event: EventProxy<TIO, TEvents>;

    getConnection(): WebSocketConnection;

    getMyPresence(): TPresence;

    getMyself(): Id<UserInfo<TIO, TPresence>> | null;

    getOther(connectionId: string): Id<UserInfo<TIO, TPresence>> | null;

    getOthers(): readonly Id<UserInfo<TIO, TPresence>>[];

    getStorage<TKey extends keyof TStorage>(type: TKey): TStorage[TKey] | null;

    getStorageJson(): InferCrdtJson<TStorage> | null;
    getStorageJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]> | null;

    getStorageLoaded: () => boolean;

    other(connectionId: string, callback: OtherSubscriptionCallback<TIO, TPresence>): () => void;

    redo(): void;

    storage: StorageProxy<TStorage>;

    storageRoot(
        fn: (value: {
            [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
        }) => void,
    ): () => void;

    subscribe: SubscribeProxy<TIO, TPresence, TStorage, TEvents>;

    transact(fn: (storage: TStorage) => void, origin?: string): void;

    undo(): void;

    updateMyPresence(presence: UpdateMyPresenceAction<TPresence>): void;
}

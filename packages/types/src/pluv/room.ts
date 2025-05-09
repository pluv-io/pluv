import type { Subject } from "wonka";
import type { ConnectionState } from "./enums";
import type { Id, JsonObject } from "../general";
import type { CrdtDocLike, CrdtType, InferCrdtJson } from "./crdt";
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

export type EventNotifierSubscriptionCallback<
    TIO extends IOLike<any, any>,
    TEvent extends keyof InferIOOutput<TIO>,
> = (value: Id<IOEventMessage<TIO, TEvent>>) => void;

export type OtherNotifierSubscriptionCallback<TIO extends IOLike, TPresence extends JsonObject> = (
    value: Id<UserInfo<TIO, TPresence>> | null,
) => void;

export interface StateNotifierSubjects<TIO extends IOLike, TPresence extends JsonObject> {
    connection: Subject<Id<WebSocketState<TIO>>>;
    "my-presence": Subject<TPresence | null>;
    myself: Subject<Readonly<Id<UserInfo<TIO>>> | null>;
    others: Subject<readonly Id<UserInfo<TIO>>[]>;
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
    /**
     * @description How many times the user has connected to the room. This can be more than 1 in
     * the case of reconnects. This is tracked because on the very first connection (i.e. when
     * count is 0) we don't want to send the storage state as an update to the room and overwrite
     * the upstream state.
     * @date April 13, 2025
     */
    count: number;
    id: string | null;
    state: ConnectionState;
}

export interface WebSocketState<TIO extends IOLike> {
    authorization: AuthorizationState<TIO>;
    connection: WebSocketConnection;
    webSocket: WebSocket | null;
}

export interface RoomLike<
    TIO extends IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig = {},
> {
    id: string;
    storageLoaded: boolean;

    broadcast<TEvent extends keyof InferIOInput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        data: Id<InferIOInput<MergeEvents<TEvents, TIO>>[TEvent]>,
    ): void;

    canRedo(): boolean;

    canUndo(): boolean;

    getDoc(): CrdtDocLike<TStorage>;

    event<TEvent extends keyof InferIOOutput<MergeEvents<TEvents, TIO>>>(
        event: TEvent,
        callback: EventNotifierSubscriptionCallback<MergeEvents<TEvents, TIO>, TEvent>,
    ): () => void;

    getConnection(): WebSocketConnection;

    getMyPresence(): TPresence;

    getMyself(): Id<UserInfo<TIO, TPresence>> | null;

    getOther(connectionId: string): Id<UserInfo<TIO, TPresence>> | null;

    getOthers(): readonly Id<UserInfo<TIO, TPresence>>[];

    getStorage<TKey extends keyof TStorage>(type: TKey): TStorage[TKey] | null;

    getStorageJson(): InferCrdtJson<TStorage> | null;
    getStorageJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]> | null;

    other(
        connectionId: string,
        callback: OtherNotifierSubscriptionCallback<TIO, TPresence>,
    ): () => void;

    redo(): void;

    storage<TKey extends keyof TStorage>(
        key: TKey,
        fn: (value: InferCrdtJson<TStorage[TKey]>) => void,
    ): () => void;

    storageRoot(
        fn: (value: {
            [P in keyof TStorage]: InferCrdtJson<TStorage[P]>;
        }) => void,
    ): () => void;

    subscribe<TSubject extends keyof StateNotifierSubjects<TIO, TPresence>>(
        name: TSubject,
        callback: SubscriptionCallback<TIO, TPresence, TSubject>,
    ): () => void;

    transact(fn: (storage: TStorage) => void, origin?: string): void;

    undo(): void;

    updateMyPresence(presence: UpdateMyPresenceAction<TPresence>): void;
}

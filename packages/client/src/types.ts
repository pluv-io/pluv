import type { AbstractCrdtDoc, CrdtType } from "@pluv/crdt";
import type {
    EventRecord,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    IOLike,
    JsonObject,
    MaybePromise,
} from "@pluv/types";
import type { ConnectionState } from "./enums";
import type { PluvClient } from "./PluvClient";

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>> | null;
}

export type EventResolver<
    TIO extends IOLike = IOLike,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> = (data: TInput, context: EventResolverContext<TIO, TPresence, TStorage>) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TIO extends IOLike = IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    doc: AbstractCrdtDoc<TStorage>;
    others: readonly UserInfo<TIO, TPresence>[];
    room: string;
    user: UserInfo<TIO, TPresence>;
}

export type InferMetadata<TClient extends PluvClient<any, any, any, any>> =
    TClient extends PluvClient<any, any, any, infer IMetadata> ? IMetadata : never;

export interface InternalSubscriptions {
    observeCrdt: (() => void) | null;
}

export type MergeEventRecords<
    TEventRecords extends EventRecord<string, any>[],
    TRoot extends EventRecord<string, any> = {},
> = TEventRecords extends [
    infer IHead extends EventRecord<string, any>,
    ...infer ITail extends EventRecord<string, any>[],
]
    ? MergeEventRecords<
          ITail,
          Omit<TRoot, keyof IHead> & {
              [P in keyof IHead]: TRoot extends Record<P, any> ? TRoot[P] | IHead[P] : IHead[P];
          }
      >
    : Id<TRoot>;

export interface PluvClientLimits {
    /**
     * @description Maximum size of presence object in bytes
     */
    presenceMaxSize?: number | null;
}

export interface PublicKeyParams<TMetadata extends JsonObject> {
    metadata: TMetadata;
}
export type PublicKey<TMetadata extends JsonObject> = string | ((params: PublicKeyParams<TMetadata>) => string);

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

export type WithMetadata<TMetadata extends JsonObject = {}> = keyof TMetadata extends never
    ? { metadata?: undefined }
    : { metadata: TMetadata };

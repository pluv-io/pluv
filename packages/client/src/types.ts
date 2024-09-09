import type { AbstractCrdtDoc, CrdtType } from "@pluv/crdt";
import type {
    EventRecord,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    IOLike,
    IORouterLike,
    JsonObject,
    MaybePromise,
    ProcedureLike,
} from "@pluv/types";

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: InferIOAuthorizeUser<InferIOAuthorize<TIO>> | null;
}

export enum ConnectionState {
    Closed = "Closed",
    Connecting = "Connecting",
    Open = "Open",
    Unavailable = "Unavailable",
    Untouched = "Untouched",
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

export type UpdateMyPresenceAction<TPresence extends JsonObject> =
    | Partial<TPresence>
    | ((oldPresence: TPresence | null) => Partial<TPresence>);

export interface UserInfo<TIO extends IOLike, TPresence extends JsonObject = {}> {
    connectionId: string;
    presence: TPresence;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>>;
}

export interface WebSocketConnection {
    count: number;
    id: string | null;
    state: ConnectionState;
}

export interface WebSocketState<TIO extends IOLike> {
    authorization: AuthorizationState<TIO>;
    connection: WebSocketConnection;
    webSocket: WebSocket | null;
}

export type MergeClientServerEvents<TClientRouter extends IORouterLike<any>, TServerRouter extends IORouterLike<any>> =
    TClientRouter extends IORouterLike<infer IClientEvents>
        ? TServerRouter extends IORouterLike<infer IServerEvents>
            ? {
                  [P in keyof IClientEvents]: IClientEvents[P] extends ProcedureLike<any, infer IClientOutput>
                      ? keyof IClientOutput extends keyof IServerEvents
                          ? IServerEvents[keyof IClientOutput]
                          : IClientEvents[P]
                      : never;
              } & IServerEvents
            : never
        : never;

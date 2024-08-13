import type { AbstractCrdtDoc } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    EventRecord,
    IOAuthorize,
    Id,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import type {
    AbstractPlatform,
    InferPlatformWebSocketSource,
    InferPlatformWebSocketType,
    InferRoomContextType,
} from "./AbstractPlatform";
import type { AbstractWebSocket } from "./AbstractWebSocket";

declare global {
    var console: {
        log: (...data: any[]) => void;
    };
}

export type EventResolver<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends Record<string, any> = {},
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> = (data: TInput, context: EventResolverContext<TPlatform, TAuthorize, TContext>) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends Record<string, any> = {},
> {
    context: TContext;
    doc: AbstractCrdtDoc<any>;
    room: string;
    /**
     * !HACK
     * @description Session should only not exist when invoking the event as a
     * "sync" event on another machine where the session doesn't exist. There must
     * be a better way to handle this, but going to make this nullable for ease
     * for now.
     *
     * `session` should not be referenced most of the time anyhow (outside of
     * internal to this library).
     * @author leedavidcs
     * @date December 25, 2022
     */
    session: WebSocketSession<TAuthorize> | null;
    sessions: readonly WebSocketSession<TAuthorize>[];
}

export type SendMessageOptions =
    | { type?: "broadcast"; sessionIds?: readonly string[] }
    | { type: "self" }
    | { type: "sync" };

export interface WebSocketSessionTimers {
    ping: number;
}

export interface WebSocketSerializedState {
    presence: JsonObject | null;
    quit: boolean;
    room: string;
    timers: WebSocketSessionTimers;
}

export type WebSocketSession<TAuthorize extends IOAuthorize<any, any, any> = BaseIOAuthorize> =
    WebSocketSerializedState & {
        id: string;
        user: InferIOAuthorizeUser<TAuthorize>;
        webSocket: AbstractWebSocket;
    };

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

type GetInitialStorageEvent<TPlatform extends AbstractPlatform> = {
    room: string;
} & InferRoomContextType<TPlatform>;

export type GetInitialStorageFn<TPlatform extends AbstractPlatform> = (
    event: GetInitialStorageEvent<TPlatform>,
) => MaybePromise<Maybe<string>>;

export interface PluvIOListeners<TPlatform extends AbstractPlatform> {
    onRoomDeleted: (event: IORoomListenerEvent<TPlatform>) => void;
    onStorageUpdated: (event: IORoomListenerEvent<TPlatform>) => void;
}

export type IORoomListenerEvent<TPlatform extends AbstractPlatform> = {
    room: string;
    encodedState: string | null;
} & InferRoomContextType<TPlatform>;

export type WebSocketType<TPlatform extends AbstractPlatform> =
    | InferPlatformWebSocketType<TPlatform>
    | InferPlatformWebSocketSource<TPlatform>;

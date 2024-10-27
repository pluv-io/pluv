import type { AbstractCrdtDoc, AbstractCrdtDocFactory } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    EventRecord,
    IOAuthorize,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferPlatformWebSocketSource,
    InferPlatformWebSocketType,
    InferRoomContextType,
} from "./AbstractPlatform";
import type { AbstractWebSocket } from "./AbstractWebSocket";
import type { PluvRouterEventConfig } from "./PluvRouter";

declare global {
    var console: {
        log: (...data: any[]) => void;
    };
}

export type PluvContext<TPlatform extends AbstractPlatform, TContext extends Record<string, any>> =
    | TContext
    | ((params: InferRoomContextType<TPlatform>) => TContext);

export interface CrdtLibraryType {
    doc: (value: any) => AbstractCrdtDocFactory<any>;
    kind: "loro" | "yjs";
}

export type EventResolver<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends Record<string, any> = {},
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> = (data: TInput, context: EventResolverContext<TPlatform, TAuthorize, TContext>) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>> = BaseIOAuthorize,
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

export type GetInitialStorageEvent = {
    room: string;
};

export type GetInitialStorageFn = (event: GetInitialStorageEvent) => MaybePromise<Maybe<string>>;

export interface PluvIOListeners<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> {
    onRoomDeleted: (event: IORoomListenerEvent<TContext>) => void;
    onRoomMessage: (event: IORoomMessageEvent<TPlatform, TAuthorize, TContext, TEvents>) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<TPlatform, TAuthorize, TContext>) => void;
    onUserConnected: (event: IOUserConnectedEvent<TPlatform, TAuthorize, TContext>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<TPlatform, TAuthorize, TContext>) => void;
}

export type IORoomListenerEvent<TContext extends Record<string, any>> = {
    context: TContext;
    encodedState: string | null;
    room: string;
};

export type IORoomMessageEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = IORoomListenerEvent<TContext> & {
    message: InferEventMessage<InferEventsOutput<TEvents>, keyof InferEventsOutput<TEvents>>;
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOStorageUpdatedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOUserConnectedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOUserDisconnectedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
};

export type WebSocketType<TPlatform extends AbstractPlatform> =
    | InferPlatformWebSocketType<TPlatform>
    | InferPlatformWebSocketSource<TPlatform>;

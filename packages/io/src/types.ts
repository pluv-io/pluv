import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type {
    BaseUser,
    CrdtDocLike,
    EventRecord,
    IOAuthorize,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferIOAuthorizeUser,
    InputZodLike,
    JsonObject,
    Maybe,
    MaybePromise,
    UndefinedProps,
} from "@pluv/types";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferPlatformWebSocketSource,
    InferPlatformWebSocketType,
    InferRoomContextType,
} from "./AbstractPlatform";
import type { AbstractWebSocket } from "./AbstractWebSocket";
import type { PluvRouter, PluvRouterEventConfig } from "./PluvRouter";

export type PluvContext<TPlatform extends AbstractPlatform, TContext extends Record<string, any>> =
    | MaybePromise<TContext>
    | ((params: InferRoomContextType<TPlatform>) => MaybePromise<TContext>);

export type EventResolverKind = "broadcast" | "self" | "sync";

export type EventResolver<
    TKind extends EventResolverKind = EventResolverKind,
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null = null,
    TContext extends Record<string, any> = {},
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> = (
    data: TInput,
    context: EventResolverContext<TKind, TPlatform, TAuthorize, TContext>,
) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TKind extends EventResolverKind = EventResolverKind,
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null = null,
    TContext extends Record<string, any> = {},
> {
    context: TContext;
    doc: CrdtDocLike<any, any>;
    garbageCollect: () => Promise<void>;
    platform: TPlatform;
    presence: JsonObject | null;
    room: string;
    session: TKind extends "sync"
        ? WebSocketSession<TAuthorize> | null
        : WebSocketSession<TAuthorize>;
    sessions: readonly WebSocketSession<TAuthorize>[];
    time: number;
}

export type SendMessageOptions =
    | { type?: "broadcast"; sessionIds?: readonly string[] }
    | { type: "self" }
    | { type: "sync" };

export interface WebSocketSessionTimers {
    ping: number;
    presence: number | null;
}

export interface WebSocketSerializedState {
    presence: JsonObject | null;
    quit: boolean;
    room: string;
    timers: WebSocketSessionTimers;
}

export type WebSocketSession<TAuthorize extends IOAuthorize<any, any> | null = null> =
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

export type GetInitialStorageEvent<TContext extends Record<string, any>> = {
    context: TContext;
    room: string;
};

export type GetInitialStorageFn<TContext extends Record<string, any>> = (
    event: GetInitialStorageEvent<TContext>,
) => MaybePromise<Maybe<string>>;

export type HandleMode = "io" | "fetch";
export type WebSocketRegistrationMode = "attached" | "detached";

export interface PlatformConfig {
    authorize: {
        secret?: boolean;
    };
    requireAuth?: boolean;
    handleMode: HandleMode;
    registrationMode: WebSocketRegistrationMode;
    listeners: {
        onRoomDeleted?: boolean;
        onRoomMessage?: boolean;
        onStorageDestroyed?: boolean;
        onStorageUpdated?: boolean;
        onUserConnected?: boolean;
        onUserDisconnected?: boolean;
    };
    router?: boolean;
}

export type ResolvedPluvIOAuthorize<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TUser extends BaseUser = any,
> = { user: InputZodLike<TUser> } & UndefinedProps<
    { secret?: string },
    Exclude<"secret", InferPlatformAuthorizeProperties<TPlatform>>
>;

export type PluvIOAuthorize<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TUser extends BaseUser | null = any,
    TContext extends Record<string, unknown> = {},
> =
    | (TUser extends BaseUser ? ResolvedPluvIOAuthorize<TPlatform, TUser> : null)
    | ((
          context: TContext,
      ) => TUser extends BaseUser ? ResolvedPluvIOAuthorize<TPlatform, TUser> : null);

export interface PluvIOLimits {
    /**
     * @description Maximum size of presence object in bytes
     */
    presenceMaxSize?: number | null;
    /**
     * @description Maximum size of storage state in bytes
     */
    storageMaxSize?: number | null;
    /**
     * @description Maximum length of user id in characters
     */
    userIdMaxLength?: number | null;
    /**
     * @description Maximum size of user object in bytes
     */
    userMaxSize?: number | null;
}

export type BasePluvIOListeners<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = {
    // DEPRECATED_ONROOMDELETED:
    /**
     * @deprecated `onRoomDeleted` with `encodedState` is deprecated. Use `onRoomDestroyed` (no `encodedState`) and `onStorageDestroyed` (with `encodedState`) instead. This callback will be removed in a future version.
     */
    onRoomDeleted: (event: IORoomListenerEvent<TPlatform, TContext>) => void;
    onRoomMessage: (event: IORoomMessageEvent<TPlatform, TAuthorize, TContext, TEvents>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<TPlatform, TContext>) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<TPlatform, TAuthorize, TContext>) => void;
    onUserConnected: (event: IOUserConnectedEvent<TPlatform, TAuthorize, TContext>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<TPlatform, TAuthorize, TContext>) => void;
};

export type PluvIOListeners<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = UndefinedProps<
    BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>,
    Exclude<
        keyof BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>,
        InferPlatformListeners<TPlatform>
    >
>;

export type PluvIORouter<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> =
    InferPlatformRouter<TPlatform> extends true
        ? { router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents> }
        : { router?: undefined };

export type InferPlatformConfig<TPlatform extends AbstractPlatform<any, any, any, any>> =
    TPlatform extends AbstractPlatform<any, any, any, infer IConfig> ? IConfig : never;

export type InferPlatformAuthorizeProperties<
    TPlatform extends AbstractPlatform<any, any, any, any>,
> = keyof {
    [P in keyof PlatformConfig["authorize"] as InferPlatformConfig<TPlatform>["authorize"][P] extends
        | true
        | undefined
        ? P
        : never]: true;
};

export type InferPlatformListeners<TPlatform extends AbstractPlatform<any, any, any, any>> = keyof {
    [P in keyof PlatformConfig["listeners"] as InferPlatformConfig<TPlatform>["listeners"][P] extends
        | true
        | undefined
        ? P
        : never]: true;
};

export type InferPlatformRouter<TPlatform extends AbstractPlatform<any, any, any, any>> =
    InferPlatformConfig<TPlatform>["router"];

export type IORoomListenerEvent<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TContext extends Record<string, any>,
> = {
    context: TContext;
    encodedState: string | null;
    platform: TPlatform;
    room: string;
};

export type IORoomDestroyedEvent<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TContext extends Record<string, any>,
> = {
    context: TContext;
    // DEPRECATED_ONROOMDELETED:
    /**
     * @deprecated This property is deprecated. Use `onStorageDestroyed` to access `encodedState`. This will be removed in a future version.
     */
    encodedState?: string | null;
    platform: TPlatform;
    room: string;
};

export type IORoomMessageEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = IORoomListenerEvent<TPlatform, TContext> & {
    message: InferEventMessage<InferEventsOutput<TEvents>, keyof InferEventsOutput<TEvents>>;
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOStorageUpdatedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TPlatform, TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOUserConnectedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TPlatform, TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
    webSocket?: InferPlatformWebSocketSource<TPlatform>;
};

export type IOUserDisconnectedEvent<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
> = IORoomListenerEvent<TPlatform, TContext> & {
    user?: InferIOAuthorizeUser<TAuthorize>;
};

export type WebSocketType<TPlatform extends AbstractPlatform> =
    | InferPlatformWebSocketType<TPlatform>
    | InferPlatformWebSocketSource<TPlatform>;

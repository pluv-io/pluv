import type {
    BaseUser,
    CrdtDocLike,
    EventRecord,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
    MaybePromise,
    UndefinedProps,
} from "@pluv/types";
import type { StandardSchemaV1 } from "@pluv/types";
import type {
    AbstractPlatform,
    InferPlatformWebSocketSource,
    InferPlatformWebSocketType,
    InferRoomContextType,
} from "./AbstractPlatform";
import type { AbstractWebSocket } from "./AbstractWebSocket";
import type { IODefs } from "./IODefs";
import type { PluvRouter } from "./PluvRouter";

export type PluvContext<TPlatform extends AbstractPlatform, TContext extends Record<string, any>> =
    | MaybePromise<TContext>
    | ((params: InferRoomContextType<TPlatform>) => MaybePromise<TContext>);

export type EventResolverKind = "broadcast" | "self" | "sync";

export type EventResolver<
    TKind extends EventResolverKind = EventResolverKind,
    T extends IODefs = IODefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> = (data: TInput, context: EventResolverContext<TKind, T>) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TKind extends EventResolverKind = EventResolverKind,
    T extends IODefs = IODefs,
> {
    context: T["context"];
    doc: CrdtDocLike<any, any>;
    garbageCollect: () => Promise<void>;
    platform: T["platform"];
    presence: JsonObject | null;
    room: string;
    storageSeeded: boolean;
    session: TKind extends "sync" ? WebSocketSession<T> | null : WebSocketSession<T>;
    sessions: readonly WebSocketSession<T>[];
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

export type WebSocketSession<T extends IODefs = IODefs> = WebSocketSerializedState & {
    id: string;
    user: InferIOAuthorizeUser<T["authorize"]>;
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
    handleMode: HandleMode;
    registrationMode: WebSocketRegistrationMode;
    listeners: {
        onRoomDestroyed?: boolean;
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
> = TPlatform["_config"]["authorize"]["secret"] extends true
    ? { user: StandardSchemaV1<unknown, TUser>; secret: string }
    : { user: StandardSchemaV1<unknown, TUser>; secret?: string };

export type PluvIOAuthorize<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TUser extends BaseUser = any,
    TContext extends Record<string, unknown> = {},
> =
    | ResolvedPluvIOAuthorize<TPlatform, TUser>
    | ((context: TContext) => ResolvedPluvIOAuthorize<TPlatform, TUser>);

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

export type BasePluvIOListeners<T extends IODefs = IODefs> = {
    onRoomDestroyed: (event: IORoomDestroyedEvent<T>) => void;
    onRoomMessage: (event: IORoomMessageEvent<T>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<T>) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => void;
    onUserConnected: (event: IOUserConnectedEvent<T>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<T>) => void;
};

export type PluvIOListeners<T extends IODefs = IODefs> = UndefinedProps<
    BasePluvIOListeners<T>,
    Exclude<keyof BasePluvIOListeners<T>, InferPlatformListeners<T["platform"]>>
>;

export type PluvIORouter<T extends IODefs = IODefs> =
    InferPlatformRouter<T["platform"]> extends true
        ? { router?: PluvRouter<T> }
        : { router?: undefined };

export type InferPlatformConfig<TPlatform extends AbstractPlatform<any, any, any, any>> =
    TPlatform extends AbstractPlatform<any, any, any, infer IConfig> ? IConfig : never;

export type InferPlatformListeners<TPlatform extends AbstractPlatform<any, any, any, any>> = keyof {
    [
        P in keyof PlatformConfig["listeners"] as InferPlatformConfig<TPlatform>["listeners"][P] extends
            | true
            | undefined
            ? P
            : never
    ]: true;
};

export type InferPlatformRouter<TPlatform extends AbstractPlatform<any, any, any, any>> =
    InferPlatformConfig<TPlatform>["router"];

export type IORoomListenerEvent<T extends IODefs = IODefs> = {
    context: T["context"];
    encodedState: string | null;
    platform: T["platform"];
    room: string;
};

export type IORoomDestroyedEvent<T extends IODefs = IODefs> = {
    context: T["context"];
    platform: T["platform"];
    room: string;
};

export type IORoomMessageEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    message: InferEventMessage<
        InferEventsOutput<T["events"]>,
        keyof InferEventsOutput<T["events"]>
    >;
    user?: InferIOAuthorizeUser<T["authorize"]>;
    webSocket?: InferPlatformWebSocketSource<T["platform"]>;
};

export type IOStorageUpdatedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    user?: InferIOAuthorizeUser<T["authorize"]>;
    webSocket?: InferPlatformWebSocketSource<T["platform"]>;
};

export type IOUserConnectedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    user?: InferIOAuthorizeUser<T["authorize"]>;
    webSocket?: InferPlatformWebSocketSource<T["platform"]>;
};

export type IOUserDisconnectedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    user?: InferIOAuthorizeUser<T["authorize"]>;
};

export type WebSocketType<TPlatform extends AbstractPlatform> =
    | InferPlatformWebSocketType<TPlatform>
    | InferPlatformWebSocketSource<TPlatform>;

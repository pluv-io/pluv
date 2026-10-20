import type { AbstractCrdtDocFactory, InferDocLike } from "@pluv/crdt";
import type {
    BaseUser,
    CrdtDocLike,
    EventRecord,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferTreatyUser,
    JsonObject,
    Maybe,
    MaybePromise,
    OperatorUser,
    ParticipantKind,
    PresenceSeq,
    SessionPresence,
    StandardSchemaV1,
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
import type { AbstractPersistence } from "./AbstractPersistence";
import type { IODefs } from "./IODefs";
import type { PluvRouter } from "./PluvRouter";
import type { DeferredResult } from "./roomEffects";

export type { DeferredResult };

export type PluvContext<TPlatform extends AbstractPlatform, TContext extends Record<string, any>> =
    | MaybePromise<TContext>
    | ((params: InferRoomContextType<TPlatform>) => MaybePromise<TContext>);

export type EventResolverKind = "broadcast" | "self";

export type EventResolver<
    _TKind extends EventResolverKind = EventResolverKind,
    T extends IODefs = IODefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> = (data: TInput, context: EventResolverContext<T>) => MaybePromise<TOutput | void>;

export type EventResolverPresence<T extends IODefs = IODefs> =
    T["treaty"]["presence"] extends StandardSchemaV1<any, infer TPresence>
        ? TPresence | null
        : JsonObject | null;

export type EventResolverDoc<T extends IODefs = IODefs> =
    T["treaty"]["storage"] extends AbstractCrdtDocFactory<any, any, any, any>
        ? InferDocLike<T["treaty"]["storage"]>
        : CrdtDocLike<any, any>;

/**
 * Context passed to user procedures. Session and storage protocol procedures
 * use a wider internal context.
 */
export interface EventResolverContext<T extends IODefs = IODefs> {
    connectionId: string;
    context: T["context"];
    doc: EventResolverDoc<T>;
    kind: ParticipantKind;
    operator: OperatorUser | null;
    presence: EventResolverPresence<T>;
    room: string;
    time: number;
    user: InferTreatyUser<T["treaty"]>;
}

/** @internal Storage `$` procedures see the document, persistence, and the seeded flag. */
export interface StorageEventContext<T extends IODefs = IODefs> {
    doc: EventResolverDoc<T>;
    persistence: AbstractPersistence;
    storageSeeded: boolean;
}

/** @internal Session `$` procedures see the connection list and attachment sink. */
export interface SessionEventContext<T extends IODefs = IODefs> {
    connectionId: string;
    kind: ParticipantKind;
    operator: OperatorUser | null;
    platform: T["platform"];
    presence: EventResolverPresence<T>;
    room: string;
    session: WebSocketSession<T>;
    sessions: readonly WebSocketSession<T>[];
    time: number;
    user: InferTreatyUser<T["treaty"]>;
}

export type SendMessageOptions =
    | { type?: "broadcast"; sessionIds?: readonly string[] }
    | { type: "self" };

export interface WebSocketSessionTimers {
    ping: number;
}

export type WebSocketSessionSeq = PresenceSeq;

export interface WebSocketSerializedState extends SessionPresence<JsonObject | null> {
    quit: boolean;
    room: string;
    timers: WebSocketSessionTimers;
}

export type WebSocketSession<T extends IODefs = IODefs> = WebSocketSerializedState & {
    id: string;
    kind: ParticipantKind;
    operator: OperatorUser | null;
    user: InferTreatyUser<T["treaty"]>;
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
export type ListenerMode = "all" | "webhook";

export interface PlatformConfig {
    authorize: {
        secret?: boolean;
    };
    handleMode: HandleMode;
    listeners: ListenerMode;
    router?: boolean;
}

export type ResolvedPluvIOAuthorize<
    TPlatform extends AbstractPlatform<any, any, any, any>,
    TUser extends BaseUser = any,
> = TPlatform["_config"]["authorize"]["secret"] extends true
    ? { user: StandardSchemaV1<unknown, TUser>; secret: string }
    : { user: StandardSchemaV1<unknown, TUser>; secret?: string };

export type PluvIOSecret<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
> = string | ((context: InferInitContextType<TPlatform>) => string);

export interface PluvIOLimits {
    /**
     * @description Allow a maxConnections value that would otherwise be rejected.
     */
    dangerouslyAllowHighPresenceFanout?: boolean | null;
    /**
     * @description Maximum live sockets in a room. Extra registers are rejected.
     * Must be a positive integer.
     * @default 256
     */
    maxConnections?: number | null;
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
     * @description Maximum combined size, in bytes, of the objects stored for one
     * session. User sessions measure the user object. Operator sessions measure
     * that user object and the operator profile together. Email is not included.
     */
    userMaxSize?: number | null;
}

export type BasePluvIOListeners<T extends IODefs = IODefs> = {
    onRoomDestroyed: (event: IORoomDestroyedEvent<T>) => void;
    onRoomMessage: (event: IORoomMessageEvent<T>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<T>) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => MaybePromise<void>;
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

type AllowedListenersByMode = {
    all: keyof BasePluvIOListeners;
    webhook: "onRoomDestroyed" | "onStorageDestroyed" | "onUserConnected" | "onUserDisconnected";
};

export type InferPlatformListeners<TPlatform extends AbstractPlatform<any, any, any, any>> =
    AllowedListenersByMode[InferPlatformConfig<TPlatform>["listeners"]];

export type InferPlatformRouter<TPlatform extends AbstractPlatform<any, any, any, any>> =
    InferPlatformConfig<TPlatform>["router"];

export type IORoomListenerEvent<T extends IODefs = IODefs> = {
    context: T["context"];
    encodedState: string | null;
    room: string;
};

export type IORoomDestroyedEvent<T extends IODefs = IODefs> = {
    context: T["context"];
    room: string;
};

export type IORoomMessageEvent<T extends IODefs = IODefs> = {
    context: T["context"];
    message: InferEventMessage<
        InferEventsOutput<T["events"]>,
        keyof InferEventsOutput<T["events"]>
    >;
    kind?: ParticipantKind;
    operator?: OperatorUser | null;
    room: string;
    user?: InferTreatyUser<T["treaty"]>;
};

export type IOStorageUpdatedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T>;

export type IOUserConnectedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    kind?: ParticipantKind;
    operator?: OperatorUser | null;
    user?: InferTreatyUser<T["treaty"]>;
};

export type IOUserDisconnectedEvent<T extends IODefs = IODefs> = IORoomListenerEvent<T> & {
    kind?: ParticipantKind;
    operator?: OperatorUser | null;
    user?: InferTreatyUser<T["treaty"]>;
};

export type WebSocketType<TPlatform extends AbstractPlatform> =
    | InferPlatformWebSocketType<TPlatform>
    | InferPlatformWebSocketSource<TPlatform>;

export type CheckpointFlush = "clean" | "dirty" | "closed";

export interface RoomSessionSnapshot<T extends IODefs = IODefs> {
    id: string;
    user: InferTreatyUser<T["treaty"]>;
    presence: JsonObject | null;
    kind: ParticipantKind;
    operator: OperatorUser | null;
    seq: { presence: number | null };
    lastPing: number;
    quit: boolean;
}

export type RoomPresenceSession<T extends IODefs = IODefs> = Pick<
    RoomSessionSnapshot<T>,
    "id" | "operator" | "presence" | "user"
>;

export type RoomStorageActor<T extends IODefs = IODefs> = Pick<
    RoomSessionSnapshot<T>,
    "id" | "kind" | "operator" | "presence" | "user"
>;

export type RoomJoinActor<T extends IODefs = IODefs> = Pick<
    RoomSessionSnapshot<T>,
    "id" | "kind" | "operator" | "user"
>;

export interface RoomEffectFrame<T extends IODefs = IODefs> {
    type: string;
    data: unknown;
    user: InferTreatyUser<T["treaty"]> | null;
    operator: OperatorUser | null;
    connectionId: string | null;
}

export interface RoomAttachment {
    presence: JsonObject | null;
    seq: number | null;
    sessionId: string;
}

export interface RoomEffects<T extends IODefs = IODefs> {
    attachments: RoomAttachment[];
    broadcast: RoomEffectFrame<T>[];
    closes: string[];
    /** Connection that produced this turn. Null when the result has no single actor. */
    connectionId: string | null;
    destroy: boolean;
    error: unknown;
    self: RoomEffectFrame<T>[];
    /** The saved copy is stale. A hosted supervisor reads this off the call result. */
    storageDirty: boolean;
}

export interface RoomRegisterResult<T extends IODefs = IODefs> {
    user: InferTreatyUser<T["treaty"]> | null;
    kind: ParticipantKind | null;
    operator: OperatorUser | null;
    encodedState: string | null;
    error: Error | null;
}

/** A hosted call released the queue. The supervisor applies the effects on a later call. */
export type Suspended = { readonly suspended: true };

export type WebSocketRegisterConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
> = {
    token?: string | null;
} & InferInitContextType<TPlatform>;

/** Internal methods `RoomSessionManager` uses. */
export interface IORoomInternal<T extends IODefs = IODefs> {
    applyPresencePatch(params: {
        name: string;
        data: unknown;
        session: RoomPresenceSession<T>;
    }): Promise<JsonObject | null | DeferredResult<JsonObject | null> | Suspended>;
    applyStorageProcedure(params: {
        name: string;
        data: unknown;
        actor: RoomStorageActor<T>;
    }): Promise<RoomEffects<T>>;
    close(session: RoomSessionSnapshot<T>): Promise<RoomEffects<T>>;
    destroy(): Promise<void>;
    flushCheckpoint(): Promise<{
        broadcast: RoomEffectFrame<T>[];
        status: CheckpointFlush;
    }>;
    initializeStorage(params: {
        input: { stateVector?: string | null; update?: string | null };
        actor: RoomJoinActor<T>;
    }): Promise<{
        changeKind: "unchanged" | "initialized" | "empty";
        state: string | null;
        storageDirty: boolean;
    }>;
    logDebug(...data: unknown[]): void;
    message(
        session: RoomSessionSnapshot<T>,
        event: { data: unknown; type: string },
    ): Promise<RoomEffects<T> | DeferredResult<RoomEffects<T>> | Suspended>;
    register(
        ...options: keyof InferInitContextType<T["platform"]> extends never
            ? [{ token?: string }?]
            : [WebSocketRegisterConfig<T["platform"]>]
    ): Promise<RoomRegisterResult<T>>;
    dropStorageUpdates(frames: readonly RoomEffectFrame<T>[]): Promise<void>;
    storageDirty(): boolean | Promise<boolean>;
    userConnected(params: {
        id: string;
        encodedState: string | null;
        kind: ParticipantKind;
        operator: OperatorUser | null;
        user: InferTreatyUser<T["treaty"]>;
    }): Promise<RoomEffects<T>>;
    whenReady(): Promise<boolean>;
}

/**
 * What `manageSessions` calls. `IORoom` implements this in-process.
 * A hosted supervisor passes a stub of the same shape beside its own platform.
 */
export interface SessionRoom<T extends IODefs = IODefs> {
    readonly id: string;
    readonly limits: PluvIOLimits | null;
    readonly "~": IORoomInternal<T>;
}

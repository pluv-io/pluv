import type { AbstractCrdtDoc } from "@pluv/crdt";
import type {
    EventRecord,
    Id,
    InputZodLike,
    JsonObject,
    MaybePromise,
} from "@pluv/types";
import {
    AbstractPlatform,
    InferPlatformEventContextType,
    InferPlatformRoomContextType,
} from "./AbstractPlatform";
import type { AbstractWebSocket } from "./AbstractWebSocket";

declare global {
    var console: {
        log: (...data: any[]) => void;
    };
}

export interface EventConfig<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TContext extends Record<string, any> = {},
    TData extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
    TResultSelf extends EventRecord<string, any> = {},
    TResultSync extends EventRecord<string, any> = {},
> {
    input?: InputZodLike<TData>;
    resolver:
        | EventResolver<
              TContext &
                  InferPlatformRoomContextType<TPlatform> &
                  InferPlatformEventContextType<TPlatform>,
              TData,
              TResultBroadcast
          >
        | EventResolverObject<
              TPlatform,
              TContext,
              TData,
              TResultBroadcast,
              TResultSelf,
              TResultSync
          >;
}

export type EventConfigType = "broadcast" | "self" | "sync";

export type SyncEventResolver<
    TContext extends Record<string, any> = {},
    TData extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
> = (
    data: TData,
    context: EventResolverContext<TContext>,
) => MaybePromise<TResultBroadcast | void>;

export type EventResolver<
    TContext extends Record<string, any> = {},
    TData extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
> = (
    data: TData,
    context: EventResolverContext<TContext>,
) => MaybePromise<TResultBroadcast | void>;

export interface EventResolverContext<
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
    session: WebSocketSession | null;
    sessions: Map<string, WebSocketSession>;
}

export type EventResolverObject<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TContext extends Record<string, any> = {},
    TData extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
    TResultSelf extends EventRecord<string, any> = {},
    TResultSync extends EventRecord<string, any> = {},
> = {
    broadcast?: EventResolver<
        TContext &
            InferPlatformRoomContextType<TPlatform> &
            InferPlatformEventContextType<TPlatform>,
        TData,
        TResultBroadcast
    >;
    self?: EventResolver<
        TContext &
            InferPlatformRoomContextType<TPlatform> &
            InferPlatformEventContextType<TPlatform>,
        TData,
        TResultSelf
    >;
    sync?: SyncEventResolver<TContext, TData, TResultSync>;
};

export type InferEventConfig<
    TPlatform extends AbstractPlatform = AbstractPlatform,
    TContext extends Record<string, any> = {},
    TInput extends EventRecord<string, any> = {},
    TOutputBroadcast extends EventRecord<string, any> = {},
    TOutputSelf extends EventRecord<string, any> = {},
    TOutputSync extends EventRecord<string, any> = {},
> = {
    [P in keyof TInput]: P extends string
        ? Id<
              EventConfig<
                  TPlatform,
                  TContext,
                  TInput[P],
                  TOutputBroadcast,
                  TOutputSelf,
                  TOutputSync
              >
          >
        : never;
};

export type SendMessageOptions =
    | { type?: "broadcast"; sessionIds?: readonly string[] }
    | { type: "self" }
    | { type: "sync" };

export interface WebSocketSessionTimers {
    ping: number;
}

export interface WebSocketSession {
    id: string;
    presence: JsonObject | null;
    quit: boolean;
    room: string;
    timers: WebSocketSessionTimers;
    webSocket: AbstractWebSocket;
    user: JsonObject | null;
}

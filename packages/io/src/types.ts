import { YjsDoc } from "@pluv/crdt-yjs";
import type {
    EventRecord,
    Id,
    InputZodLike,
    JsonObject,
    MaybePromise,
} from "@pluv/types";
import type { AbstractWebSocket } from "./AbstractWebSocket";

export interface Console {
    debug(...data: any[]): void;
    error(...data: any[]): void;
    info(...data: any[]): void;
    log(...data: any[]): void;
    warn(...data: any[]): void;
}

declare global {
    var console: {
        log: (...data: any[]) => void;
    };
}

export interface EventConfig<
    TContext extends JsonObject = {},
    TData extends JsonObject = {},
    TResult extends EventRecord<string, any> = {}
> {
    input?: InputZodLike<TData>;
    options?: SendMessageOptions;
    resolver: EventResolver<TContext, TData, TResult>;
}

export type EventConfigType = "broadcast" | "self" | "sync";

export type EventResolver<
    TContext extends JsonObject = {},
    TData extends JsonObject = {},
    TResult extends EventRecord<string, any> = {}
> = (
    data: TData,
    context: EventResolverContext<TContext>
) => MaybePromise<TResult | void>;

export interface EventResolverContext<TContext extends JsonObject = {}> {
    context: TContext;
    doc: YjsDoc<any>;
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

export type InferEventConfig<
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutput extends EventRecord<string, any> = {}
> = {
    [P in keyof TInput]: P extends string
        ? Id<EventConfig<TContext, TInput[P], TOutput>>
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

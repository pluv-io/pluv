import type { IOEventMessage, MaybePromise } from "@pluv/types";
import type { WebSocketSession } from "./types";

export type AbstractEvent = {};

export type AbstractCloseEvent = AbstractEvent & {
    readonly code: number;
    readonly reason: string;
};

export type AbstractMessageEvent<T = any> = AbstractEvent & {
    readonly data: T;
};

export type AbstractErrorEvent = AbstractEvent & {
    error: unknown;
    message: string;
};

export interface AbstractEventMap {
    close: AbstractCloseEvent;
    message: AbstractMessageEvent;
    error: AbstractErrorEvent;
}

export type EventType = keyof AbstractEventMap;

export interface AbstractWebSocketHandleErrorParams {
    error: unknown;
    message?: string;
    session?: WebSocketSession<any>;
}

export type AbstractListener<TType extends keyof AbstractEventMap> = (
    event: AbstractEventMap[TType],
) => MaybePromise<void>;

export interface AbstractWebSocketConfig {
    room: string;
    userId: string | null;
}

export abstract class AbstractWebSocket {
    /** The connection is not yet open. */
    public readonly CONNECTING = 0;
    /** The connection is open and ready to communicate. */
    public readonly OPEN = 1;
    /** The connection is in the process of closing. */
    public readonly CLOSING = 2;
    /** The connection is closed. */
    public readonly CLOSED = 3;

    public room: string;

    public abstract get readyState(): 0 | 1 | 2 | 3;
    public abstract get sessionId(): string;

    constructor(config: AbstractWebSocketConfig) {
        const { room } = config;

        this.room = room;
    }

    /**
     * TODO
     * @description Return an unsubscribe method to remove the event-listener.
     * This is preferred over adding an explicit abstract removeEventListener
     * method, because the implementing class might have to transform the
     * listener, and removing the same listener might be complicated as a
     * result.
     * @author leedavidcs
     * @date August 28, 2022
     */
    public abstract addEventListener<TType extends EventType>(type: TType, handler: AbstractListener<TType>): void;

    public abstract close(code?: number | undefined, reason?: string | undefined): void;

    public abstract send(message: ArrayBuffer | ArrayBufferView | string): void;

    public abstract terminate(): void;

    public handleError(params: AbstractWebSocketHandleErrorParams): void {
        const { error, message = error instanceof Error ? error.message : "Unexpected error", session } = params;

        const stack: string | null = error instanceof Error ? (error.stack ?? null) : null;

        return this.sendMessage({
            connectionId: session?.id ?? null,
            data: { message, stack },
            room: this.room,
            type: "$ERROR",
            user: session?.user ?? null,
        });
    }

    public sendMessage<TMessage extends IOEventMessage<any> = IOEventMessage<any>>(data: TMessage): void {
        return this.send(JSON.stringify(data));
    }
}

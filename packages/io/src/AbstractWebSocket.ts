import type {
    BaseUser,
    InferIOAuthorizeUser,
    IOAuthorize,
    IOEventMessage,
    JsonObject,
    MaybePromise,
} from "@pluv/types";
import type { AbstractPersistance } from "./AbstractPersistance";
import type { WebSocketSerializedState, WebSocketSession } from "./types";

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
    message?: string;
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
    room: string;
    session?: WebSocketSession<any>;
}

export type AbstractListener<TType extends keyof AbstractEventMap> = (
    event: AbstractEventMap[TType],
) => MaybePromise<void>;

export type InferWebSocketSource<TAbstractWebSocket extends AbstractWebSocket> =
    TAbstractWebSocket extends AbstractWebSocket<infer IWebSocket> ? IWebSocket : never;

export interface AbstractWebSocketConfig {
    persistance: AbstractPersistance;
    room: string;
}

export abstract class AbstractWebSocket<TWebSocket = any> {
    /** The connection is not yet open. */
    public readonly CONNECTING = 0;
    /** The connection is open and ready to communicate. */
    public readonly OPEN = 1;
    /** The connection is in the process of closing. */
    public readonly CLOSING = 2;
    /** The connection is closed. */
    public readonly CLOSED = 3;

    public readonly persistance: AbstractPersistance;
    public readonly room: string;
    public readonly webSocket: TWebSocket;

    private _user: BaseUser | null = null;

    public abstract set presence(presence: JsonObject | null);
    public abstract get readyState(): 0 | 1 | 2 | 3;
    public abstract get sessionId(): string;
    public abstract get state(): WebSocketSerializedState;
    public abstract set state(state: WebSocketSerializedState);

    constructor(webSocket: TWebSocket, config: AbstractWebSocketConfig) {
        const { persistance, room } = config;

        this.persistance = persistance;
        this.room = room;
        this.webSocket = webSocket;
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

    public async getSession<TAuthorize extends IOAuthorize<any, any, any>>(): Promise<WebSocketSession<TAuthorize>> {
        const sessionId = this.sessionId;
        const state = this.state;
        const room = state.room;

        const user = this._user ?? (await this.persistance.getUser(room, sessionId));

        this._user = user as BaseUser;

        return {
            ...state,
            id: sessionId,
            user: user as InferIOAuthorizeUser<TAuthorize>,
            webSocket: this,
        };
    }

    public handleError(params: AbstractWebSocketHandleErrorParams): void {
        const { error, message: _message, room, session } = params;

        const message = error instanceof Error ? error.message : "Unexpected error";
        const stack: string | null = error instanceof Error ? (error.stack ?? null) : null;

        return this.sendMessage({
            connectionId: session?.id ?? null,
            data: { message, stack },
            room,
            type: "$ERROR",
            user: session?.user ?? null,
        });
    }

    public sendMessage<TMessage extends IOEventMessage<any> = IOEventMessage<any>>(data: TMessage): void {
        return this.send(JSON.stringify(data));
    }
}

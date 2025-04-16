import type {
    AbstractCloseEvent,
    AbstractErrorEvent,
    AbstractEventMap,
    AbstractListener,
    AbstractMessageEvent,
    AbstractWebSocketConfig,
    WebSocketSerializedState,
    WebSocketSession,
} from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import type { InferIOAuthorizeUser, IOAuthorize, JsonObject } from "@pluv/types";
import crypto from "node:crypto";
import type { WebSocket } from "ws";

export interface NodeWebSocketEventMap {
    close: AbstractCloseEvent;
    message: AbstractMessageEvent;
    error: AbstractErrorEvent;
}

export type NodeWebSocketConfig = AbstractWebSocketConfig;

export class NodeWebSocket<
    TAuthorize extends IOAuthorize<any, any> | null = null,
> extends AbstractWebSocket<WebSocket> {
    private _sessionId: string | null = null;
    private _state: WebSocketSerializedState;
    private _user: InferIOAuthorizeUser<TAuthorize> = null as InferIOAuthorizeUser<TAuthorize>;

    public set presence(presence: JsonObject | null) {
        this._state.presence = presence;
    }

    public get readyState(): 0 | 1 | 2 | 3 {
        return this.webSocket.readyState;
    }

    public get session(): WebSocketSession<TAuthorize> {
        const sessionId = this.sessionId;
        const state = this._state;
        const user = this._user;

        return {
            ...state,
            id: sessionId,
            user,
            webSocket: this,
        };
    }

    public get sessionId(): string {
        if (this._sessionId) return this._sessionId;

        const sessionId = this._sessionId ?? `p_${crypto.randomUUID()}`;

        this._sessionId = sessionId;

        return sessionId;
    }

    public get state(): WebSocketSerializedState {
        return this._state;
    }

    public set state(state: WebSocketSerializedState) {
        this._state = state;
    }

    public set user(user: InferIOAuthorizeUser<TAuthorize>) {
        this._user = user;
    }

    constructor(webSocket: WebSocket, config: NodeWebSocketConfig) {
        const { room } = config;

        super(webSocket, config);

        const currentTime = new Date().getTime();
        this._state = {
            presence: null,
            quit: false,
            room,
            timers: { ping: currentTime, presence: currentTime },
        };
    }

    public addEventListener<TType extends keyof AbstractEventMap>(type: TType, handler: AbstractListener<TType>): void {
        switch (type) {
            case "close":
                this.webSocket.on("close", async (code, buffer) => {
                    const reason = buffer.toString("utf-8");

                    await Promise.resolve((handler as AbstractListener<"close">)({ code, reason }));
                });

                return;
            case "error":
                this.webSocket.on("error", async (error) => {
                    const message = error.message;

                    await Promise.resolve((handler as AbstractListener<"error">)({ error, message }));
                });

                return;
            case "message":
                this.webSocket.on("message", async (data) => {
                    await Promise.resolve((handler as AbstractListener<"message">)({ data }));
                });

                return;
            default:
        }
    }

    public close(code?: number | undefined, reason?: string | undefined): void {
        const canClose = [this.CONNECTING, this.OPEN].some((readyState) => readyState === this.readyState);

        if (!canClose) return;

        this.webSocket.close(code, reason);
    }

    public send(message: string | ArrayBuffer | ArrayBufferView): void {
        if (this.readyState !== this.OPEN) return;

        this.webSocket.send(message, (error) => {
            if (error) throw error;
        });
    }

    public terminate(): void {
        this.webSocket.terminate();
    }
}

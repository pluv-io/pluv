import type {
    AbstractCloseEvent,
    AbstractErrorEvent,
    AbstractEventMap,
    AbstractListener,
    AbstractMessageEvent,
    AbstractWebSocketConfig,
} from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import crypto from "node:crypto";
import type { WebSocket } from "ws";

export interface NodeWebSocketEventMap {
    close: AbstractCloseEvent;
    message: AbstractMessageEvent;
    error: AbstractErrorEvent;
}

export type NodeWebSocketConfig = AbstractWebSocketConfig;

export class NodeWebSocket extends AbstractWebSocket {
    private _sessionId: string;

    public webSocket: WebSocket;

    public get readyState(): 0 | 1 | 2 | 3 {
        return this.webSocket.readyState;
    }

    public get sessionId(): string {
        return this._sessionId;
    }

    constructor(webSocket: WebSocket, config: NodeWebSocketConfig) {
        const { room, userId } = config;

        super({ room, userId });

        this._sessionId = crypto.randomUUID();
        this.webSocket = webSocket;
    }

    public addEventListener<TType extends keyof AbstractEventMap>(type: TType, handler: AbstractListener<TType>): void {
        switch (type) {
            case "close":
                this.webSocket.on("close", async (code, reason) => {
                    await Promise.resolve(
                        (handler as AbstractListener<"close">)({
                            code,
                            reason: reason.toString("utf-8"),
                        }),
                    );
                });

                return;
            case "error":
                this.webSocket.on("error", async (error) => {
                    await Promise.resolve(
                        (handler as AbstractListener<"error">)({
                            error,
                            message: error.message,
                        }),
                    );
                });

                return;
            case "message":
                this.webSocket.on("message", async (data) => {
                    await Promise.resolve(
                        (handler as AbstractListener<"message">)({
                            data,
                        }),
                    );
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

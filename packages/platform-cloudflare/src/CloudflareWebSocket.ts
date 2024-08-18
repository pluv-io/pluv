import type { AbstractEventMap, AbstractListener, AbstractWebSocketConfig, WebSocketSerializedState } from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import type { JsonObject } from "@pluv/types";

export interface CloudflareWebSocketEventMap {
    close: CloseEvent;
    message: MessageEvent;
    open: Event;
    error: ErrorEvent;
}

export type CloudflareWebSocketConfig = AbstractWebSocketConfig;

export class CloudflareWebSocket extends AbstractWebSocket<WebSocket> {
    public set presence(presence: JsonObject | null) {
        const deserialized = this.webSocket.deserializeAttachment();
        const state = deserialized.state;

        this.webSocket.serializeAttachment({
            ...this.webSocket.deserializeAttachment(),
            state: { ...state, presence },
        });
    }

    public get readyState(): 0 | 1 | 2 | 3 {
        return this.webSocket.readyState as 0 | 1 | 2 | 3;
    }

    public get sessionId(): string {
        const deserialized = this.webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId ?? crypto.randomUUID();

        if (typeof deserialized.sessionId !== "string") {
            this.webSocket.serializeAttachment({ ...deserialized, sessionId });
        }

        return sessionId;
    }

    public get state(): WebSocketSerializedState {
        const deserialized = this.webSocket.deserializeAttachment();
        const state = deserialized?.state ?? null;

        if (!state) throw new Error("Could not get websocket state");

        return state;
    }

    public set state(state: WebSocketSerializedState) {
        const deserialized = this.webSocket.deserializeAttachment();

        this.webSocket.serializeAttachment({ ...deserialized, state });
    }

    constructor(webSocket: WebSocket, config: CloudflareWebSocketConfig) {
        const { room } = config;

        super(webSocket, config);

        const state: WebSocketSerializedState = {
            presence: null,
            quit: false,
            room,
            timers: { ping: new Date().getTime() },
        };

        webSocket.serializeAttachment({
            sessionId: this.sessionId,
            state,
            ...webSocket.deserializeAttachment(),
        });
    }

    public addEventListener<TType extends keyof AbstractEventMap>(type: TType, handler: AbstractListener<TType>) {
        this.webSocket.addEventListener(type, handler as any);
    }

    public close(code?: number | undefined, reason?: string | undefined): void {
        const canClose = [this.CONNECTING, this.OPEN].some((readyState) => readyState === this.readyState);

        if (!canClose) return;

        this.webSocket.close(code, reason);
    }

    public send(message: string | ArrayBuffer | ArrayBufferView): void {
        if (this.readyState !== this.OPEN) return;

        this.webSocket.send(message);
    }

    public terminate(): void {
        return this.webSocket.close(1011, "Terminated");
    }
}

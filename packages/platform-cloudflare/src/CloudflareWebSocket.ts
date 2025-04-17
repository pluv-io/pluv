import type {
    AbstractEventMap,
    AbstractListener,
    AbstractWebSocketConfig,
    WebSocketSerializedState,
    WebSocketSession,
} from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import type { InferIOAuthorizeUser, IOAuthorize, JsonObject } from "@pluv/types";

export interface CloudflareWebSocketEventMap {
    close: CloseEvent;
    message: MessageEvent;
    open: Event;
    error: ErrorEvent;
}

export type CloudflareWebSocketConfig = AbstractWebSocketConfig;

export class CloudflareWebSocket<TAuthorize extends IOAuthorize<any, any> | null = null> extends AbstractWebSocket<
    WebSocket,
    TAuthorize
> {
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

    public get session(): WebSocketSession<TAuthorize> {
        const deserialized = this.webSocket.deserializeAttachment();
        const sessionId = deserialized.sessionId as string;
        const state = this.state;
        const user = (deserialized.user ?? null) as InferIOAuthorizeUser<TAuthorize>;

        return {
            ...state,
            id: sessionId,
            user,
            webSocket: this,
        };
    }

    public get sessionId(): string {
        const deserialized = this.webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId ?? `p_${crypto.randomUUID()}`;

        if (typeof deserialized.sessionId !== "string") {
            this.webSocket.serializeAttachment({ ...deserialized, sessionId });
        }

        return sessionId;
    }

    public get state(): WebSocketSerializedState {
        const deserialized = this.webSocket.deserializeAttachment();
        const state = deserialized?.state ?? null;

        if (!state) throw new Error("Could not get websocket state");

        const currentPing = state.timers.ping;
        const lastPing = this._platform.getLastPing(this);

        if (!lastPing) return state;
        if (currentPing >= lastPing) return state;

        const newState: WebSocketSerializedState = {
            ...state,
            timers: { ...state.timers, ping: lastPing },
        };

        return this._platform.setSerializedState(this, newState);
    }

    public set state(state: WebSocketSerializedState) {
        const deserialized = this.webSocket.deserializeAttachment();

        this.webSocket.serializeAttachment({ ...deserialized, state });
    }

    public set user(user: InferIOAuthorizeUser<TAuthorize>) {
        const deserialized = this.webSocket.deserializeAttachment();

        this.webSocket.serializeAttachment({ ...deserialized, user });
    }

    constructor(webSocket: WebSocket, config: CloudflareWebSocketConfig) {
        const { room } = config;

        super(webSocket, config);

        const state: WebSocketSerializedState = {
            presence: null,
            quit: false,
            room,
            timers: {
                ping: new Date().getTime(),
                presence: null,
            },
        };

        webSocket.serializeAttachment({
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

    public terminate(code: number = 1011): void {
        return this.webSocket.close(code, "Terminated");
    }
}

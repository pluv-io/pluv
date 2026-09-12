import type {
    AbstractEventMap,
    AbstractListener,
    AbstractWebSocketConfig,
    WebSocketSerializedState,
    WebSocketSession,
} from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import type { InferIOAuthorizeUser, IOAuthorize, JsonObject } from "@pluv/types";

type TestSocketListener = (event: any) => unknown;

/**
 * @description Stands in for the runtime-provided socket (`ws.WebSocket`, a Cloudflare
 * WebSocket, etc). The id doubles as the session id, so sessions are deterministic.
 */
export class TestSocket {
    public readonly id: string;
    public readonly sent: string[] = [];
    public readyState: 0 | 1 | 2 | 3 = 1;
    /** When set, `TestWebSocket.send` throws instead of recording the message. */
    public throwOnSend: Error | null = null;

    private readonly _listeners = new Map<string, Set<TestSocketListener>>();

    constructor(id: string) {
        this.id = id;
    }

    public addListener(type: string, listener: TestSocketListener): void {
        const listeners = this._listeners.get(type) ?? new Set<TestSocketListener>();

        this._listeners.set(type, listeners);
        listeners.add(listener);
    }

    public async emit(type: string, event: unknown): Promise<void> {
        const listeners = Array.from(this._listeners.get(type) ?? []);

        for (const listener of listeners) await Promise.resolve(listener(event));
    }

    public get messages(): { type: string; data: any }[] {
        return this.sent.map((message) => JSON.parse(message));
    }
}

export class TestWebSocket<
    TAuthorize extends IOAuthorize<any, any> = IOAuthorize<any, any>,
> extends AbstractWebSocket<TestSocket> {
    private _state: WebSocketSerializedState;
    private _user: InferIOAuthorizeUser<TAuthorize> | null = null;

    public set presence(presence: JsonObject | null) {
        this._state.presence = presence;
    }

    public get readyState(): 0 | 1 | 2 | 3 {
        return this.webSocket.readyState;
    }

    public get session(): WebSocketSession<TAuthorize> {
        const user = this._user;

        if (!user) {
            throw new Error("WebSocket is not authorized");
        }

        return {
            ...this._state,
            id: this.sessionId,
            user,
            webSocket: this,
        };
    }

    public get sessionId(): string {
        return this.webSocket.id;
    }

    public get state(): WebSocketSerializedState {
        return this._state;
    }

    public set state(state: WebSocketSerializedState) {
        this._state = state;
    }

    public get user(): InferIOAuthorizeUser<TAuthorize> | null {
        return this._user;
    }

    public set user(user: InferIOAuthorizeUser<TAuthorize>) {
        this._user = user;
    }

    constructor(webSocket: TestSocket, config: AbstractWebSocketConfig) {
        const { room } = config;

        super(webSocket, config);

        this._state = {
            presence: null,
            quit: false,
            room,
            timers: {
                ping: new Date().getTime(),
                presence: null,
            },
        };
    }

    public addEventListener<TType extends keyof AbstractEventMap>(
        type: TType,
        handler: AbstractListener<TType>,
    ): void {
        this.webSocket.addListener(type, handler as TestSocketListener);
    }

    public close(code?: number, reason?: string): void {
        const canClose = [this.CONNECTING, this.OPEN].some(
            (readyState) => readyState === this.readyState,
        );

        if (!canClose) return;

        this.webSocket.readyState = this.CLOSED;

        void this.webSocket.emit("close", { code: code ?? 1_000, reason: reason ?? "" });
    }

    public send(message: string | ArrayBuffer | ArrayBufferView): void {
        if (this.readyState !== this.OPEN) return;

        if (this.webSocket.throwOnSend) throw this.webSocket.throwOnSend;

        this.webSocket.sent.push(
            typeof message === "string"
                ? message
                : new TextDecoder().decode(message as ArrayBuffer),
        );
    }

    public terminate(): void {
        this.webSocket.readyState = this.CLOSED;
    }
}

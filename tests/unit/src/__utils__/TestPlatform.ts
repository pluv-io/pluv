import type {
    AbstractPersistence,
    AbstractPlatformConfig,
    AbstractPubSub,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import type { IOAuthorize } from "@pluv/types";
import crypto from "node:crypto";
import { TestSocket, TestWebSocket } from "./TestWebSocket";

export type TestPlatformConfig = {
    mode?: WebSocketRegistrationMode;
    persistence?: AbstractPersistence;
    pubSub?: AbstractPubSub;
    /** Sockets reported as pre-existing, as Cloudflare does after waking from hibernation. */
    hibernatedWebSockets?: readonly TestSocket[];
    serializedStates?: ReadonlyMap<TestSocket, WebSocketSerializedState>;
};

/**
 * @description The config generic must be spelled out with literal types. Left to the default
 * `PlatformConfig`, the flags widen to `boolean` and `@pluv/io` infers that listeners such as
 * `onStorageDestroyed` are unsupported.
 */
export class TestPlatform<
    TAuthorize extends IOAuthorize<any, any> | null = null,
> extends AbstractPlatform<
    TestWebSocket<TAuthorize>,
    {},
    {},
    {
        authorize: { secret: true };
        handleMode: "io";
        requireAuth: false;
        registrationMode: WebSocketRegistrationMode;
        listeners: {
            onRoomDestroyed: true;
            onRoomMessage: true;
            onStorageDestroyed: true;
            onStorageUpdated: true;
            onUserConnected: true;
            onUserDisconnected: true;
        };
        router: true;
    }
> {
    public readonly id = crypto.randomUUID();
    public readonly _config;
    public readonly _name = "platformTest";

    private readonly _hibernatedWebSockets: readonly TestSocket[];
    private readonly _mode: WebSocketRegistrationMode;
    private readonly _serializedStates: ReadonlyMap<TestSocket, WebSocketSerializedState>;
    // Stable per socket, otherwise presence/quit/ping state is discarded between calls.
    private readonly _wrapped = new Map<TestSocket, TestWebSocket<TAuthorize>>();

    constructor(config: TestPlatformConfig = {}) {
        const {
            hibernatedWebSockets = [],
            mode = "attached",
            persistence,
            pubSub,
            serializedStates = new Map<TestSocket, WebSocketSerializedState>(),
        } = config;

        super(persistence && pubSub ? { persistence, pubSub } : {});

        this._hibernatedWebSockets = hibernatedWebSockets;
        this._mode = mode;
        this._serializedStates = serializedStates;

        this._config = {
            authorize: { secret: true as const },
            handleMode: "io" as const,
            registrationMode: mode,
            requireAuth: false as const,
            listeners: {
                onRoomDestroyed: true as const,
                onStorageDestroyed: true as const,
                onStorageUpdated: true as const,
                onUserConnected: true as const,
                onUserDisconnected: true as const,
                onRoomMessage: true as const,
            },
            router: true as const,
        };
    }

    public acceptWebSocket(): Promise<void> {
        return Promise.resolve(undefined);
    }

    public convertWebSocket(
        webSocket: TestSocket,
        config: ConvertWebSocketConfig,
    ): TestWebSocket<TAuthorize> {
        const existing = this._wrapped.get(webSocket);

        if (existing) return existing;

        const converted = new TestWebSocket<TAuthorize>(webSocket, {
            persistence: this.persistence,
            platform: this,
            room: config.room,
        });

        this._wrapped.set(webSocket, converted);

        return converted;
    }

    public getLastPing(): number | null {
        return null;
    }

    public getSerializedState(webSocket: TestSocket): WebSocketSerializedState | null {
        return this._serializedStates.get(webSocket) ?? null;
    }

    public getSessionId(webSocket: TestSocket): string | null {
        return webSocket.id;
    }

    public getWebSockets(): readonly TestSocket[] {
        return this._hibernatedWebSockets;
    }

    public initialize(config: AbstractPlatformConfig<{}>): this {
        return new TestPlatform<TAuthorize>({
            hibernatedWebSockets: this._hibernatedWebSockets,
            mode: this._mode,
            persistence: this.persistence.initialize(config.roomContext),
            pubSub: this.pubSub,
            serializedStates: this._serializedStates,
        })._initialize() as this;
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        if (typeof data === "string") return JSON.parse(data);

        return JSON.parse(new TextDecoder().decode(data));
    }

    public randomUUID(): string {
        return crypto.randomUUID();
    }

    public setSerializedState(
        webSocket: TestWebSocket<TAuthorize>,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        webSocket.state = state;

        return webSocket.state;
    }
}

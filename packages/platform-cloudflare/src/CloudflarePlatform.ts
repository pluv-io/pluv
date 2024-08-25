import type {
    AbstractPlatformConfig,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { CloudflareWebSocket } from "./CloudflareWebSocket";
import { DEFAULT_REGISTRATION_MODE } from "./constants";

export type CloudflarePlatformConfig<TEnv extends Record<string, any> = {}> = AbstractPlatformConfig<
    { env: TEnv },
    { state: DurableObjectState }
> & { mode?: WebSocketRegistrationMode };

export class CloudflarePlatform<TEnv extends Record<string, any> = {}> extends AbstractPlatform<
    CloudflareWebSocket,
    { env: TEnv },
    { state: DurableObjectState }
> {
    readonly _registrationMode: WebSocketRegistrationMode;

    constructor(config: CloudflarePlatformConfig<TEnv> = {}) {
        super({
            ...config,
            ...(config.context && config.mode === "detached"
                ? { persistence: new PersistenceCloudflareTransactionalStorage(config.context) }
                : {}),
        });

        this._registrationMode = config.mode ?? DEFAULT_REGISTRATION_MODE;

        const detachedState = this._getDetachedState();

        if (!detachedState) return;

        detachedState.setWebSocketAutoResponse(
            new WebSocketRequestResponsePair('{"type":"$PING","data":{}}', JSON.stringify({ type: "$PONG", data: {} })),
        );
    }

    public async acceptWebSocket(webSocket: CloudflareWebSocket): Promise<void> {
        const detachedState = this._getDetachedState();

        if (!detachedState) {
            webSocket.webSocket.accept();

            return;
        }

        detachedState.acceptWebSocket(webSocket.webSocket);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): CloudflareWebSocket {
        const { room } = config;

        return new CloudflareWebSocket(webSocket, { persistence: this.persistence, room });
    }

    public getLastPing(webSocket: CloudflareWebSocket): number | null {
        const detachedState = this._getDetachedState();

        if (!detachedState) return null;

        const timestamp = detachedState.getWebSocketAutoResponseTimestamp(webSocket.webSocket);

        return timestamp?.getTime() ?? null;
    }

    public getSerializedState(webSocket: WebSocket): WebSocketSerializedState | null {
        const deserialized = webSocket.deserializeAttachment();

        return deserialized?.state ?? null;
    }

    public getSessionId(webSocket: WebSocket): string | null {
        const deserialized = webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId;

        if (typeof sessionId !== "string") return null;

        return sessionId;
    }

    public getWebSockets(): readonly WebSocket[] {
        const detachedState = this._getDetachedState();

        if (!detachedState) return [];

        return detachedState.getWebSockets() ?? [];
    }

    public initialize(config: AbstractPlatformConfig<{ env: TEnv }, { state: DurableObjectState }>): this {
        const context = config.context ?? { ...this._ioContext, ...this._roomContext };

        if (!context.env || !context.state) {
            throw new Error("Could not derive platform context");
        }

        return new CloudflarePlatform<TEnv>({
            mode: this._registrationMode,
            persistence: this.persistence,
            pubSub: this.pubSub,
            ...config,
            context: { env: context.env, state: context.state },
        })._initialize() as this;
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        if (typeof data === "string") return JSON.parse(data);

        const decoder = new TextDecoder("utf8");

        return JSON.parse(decoder.decode(data));
    }

    public randomUUID(): string {
        return crypto.randomUUID();
    }

    public setSerializedState(webSocket: CloudflareWebSocket, state: WebSocketSerializedState): void {
        const deserialized = webSocket.webSocket.deserializeAttachment() ?? {};

        webSocket.webSocket.serializeAttachment({ ...deserialized, state });
    }

    private _getDetachedState(): DurableObjectState | null {
        if (this._registrationMode !== "detached") return null;

        return this._roomContext?.state ?? null;
    }
}

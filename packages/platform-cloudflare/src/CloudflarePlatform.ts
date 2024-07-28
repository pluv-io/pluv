import type { AbstractPlatformConfig, ConvertWebSocketConfig, WebSocketRegistrationMode } from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { CloudflareWebSocket } from "./CloudflareWebSocket";
import { PersistanceCloudflare } from "./PersistanceCloudflare";

export type CloudflarePlatformConfig<TEnv extends Record<string, any> = {}> = AbstractPlatformConfig<
    { env: TEnv },
    { state: DurableObjectState }
> & { mode?: WebSocketRegistrationMode };

export class CloudflarePlatform<TEnv extends Record<string, any> = {}> extends AbstractPlatform<
    WebSocket,
    { env: TEnv },
    { state: DurableObjectState }
> {
    readonly _registrationMode: WebSocketRegistrationMode;

    constructor(config: CloudflarePlatformConfig<TEnv> = {}) {
        super({
            ...config,
            ...(config.context && config.mode === "detached"
                ? { persistance: new PersistanceCloudflare(config.context) }
                : {}),
        });

        this._registrationMode = config.mode ?? "attached";

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
        return new CloudflareWebSocket(webSocket, config);
    }

    public getLastPing(webSocket: CloudflareWebSocket): number | null {
        const detachedState = this._getDetachedState();

        if (!detachedState) return null;

        const timestamp = detachedState.getWebSocketAutoResponseTimestamp(webSocket.webSocket);

        return timestamp?.getTime() ?? null;
    }

    public getSessionId(webSocket: WebSocket): string | null {
        const deserialized = webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId;

        if (typeof sessionId !== "string") {
            throw new Error("This websocket was not registered");
        }

        return sessionId;
    }

    public getWebSockets(): readonly WebSocket[] {
        const detachedState = this._getDetachedState();

        if (!detachedState) return [];

        return detachedState.getWebSockets() ?? [];
    }

    public initialize(
        config: AbstractPlatformConfig<{ env: TEnv }, { state: DurableObjectState }>,
    ): CloudflarePlatform<TEnv> {
        return new CloudflarePlatform(config)._initialize();
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        if (typeof data === "string") return JSON.parse(data);

        const decoder = new TextDecoder("utf8");

        return JSON.parse(decoder.decode(data));
    }

    public randomUUID(): string {
        return crypto.randomUUID();
    }

    private _getDetachedState(): DurableObjectState | null {
        if (this._registrationMode !== "detached") return null;

        return this._roomContext?.state ?? null;
    }
}

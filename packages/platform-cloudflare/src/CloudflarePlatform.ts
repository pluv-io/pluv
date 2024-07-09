import type { AbstractPlatformConfig, AbstractWebSocket, ConvertWebSocketConfig } from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { CloudflareWebSocket } from "./CloudflareWebSocket";
import { PersistanceCloudflare } from "./PersistanceCloudflare";

export class CloudflarePlatform<TEnv extends Record<string, any> = {}> extends AbstractPlatform<
    WebSocket,
    { env: TEnv },
    { state: DurableObjectState }
> {
    constructor(config: AbstractPlatformConfig<{ env: TEnv }, { state: DurableObjectState }> = {}) {
        super({
            ...config,
            ...(config.context ? { persistance: new PersistanceCloudflare(config.context) } : {}),
        });

        const state = config.context?.state;

        if (!state) return;

        state.setWebSocketAutoResponse(
            new WebSocketRequestResponsePair('{"type":"$PING","data":{}}', JSON.stringify({ type: "$PONG", data: {} })),
        );
    }

    public async acceptWebSocket(webSocket: CloudflareWebSocket): Promise<void> {
        const state = this._roomContext?.state;

        if (!state) return;

        state.acceptWebSocket(webSocket.webSocket);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): CloudflareWebSocket {
        return new CloudflareWebSocket(webSocket, config);
    }

    public getLastPingTime(webSocket: CloudflareWebSocket): number | null {
        const state = this._roomContext?.state;

        if (!state) return null;

        const timestamp = state.getWebSocketAutoResponseTimestamp(webSocket.webSocket);

        return timestamp?.getTime() ?? null;
    }

    public getWebSockets(): readonly WebSocket[] {
        const state = this._roomContext?.state;

        return state?.getWebSockets() ?? [];
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
}

import type { ConvertWebSocketConfig } from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { CloudflareWebSocket } from "./CloudflareWebSocket";

export class CloudflarePlatform<TEnv extends Record<string, any> = {}> extends AbstractPlatform<
    WebSocket,
    { env: TEnv },
    { request: Request }
> {
    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): CloudflareWebSocket {
        return new CloudflareWebSocket(webSocket, config);
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

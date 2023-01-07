import type { AbstractWebSocketConfig } from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { CloudflareWebSocket } from "./CloudflareWebSocket";

export class CloudflarePlatform extends AbstractPlatform<WebSocket> {
    public convertWebSocket(
        webSocket: WebSocket,
        config: AbstractWebSocketConfig
    ): CloudflareWebSocket {
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

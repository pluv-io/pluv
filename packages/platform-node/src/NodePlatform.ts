import type { AbstractPersistance, ConvertWebSocketConfig } from "@pluv/io";
import { AbstractPlatform, AbstractPubSub } from "@pluv/io";
import crypto from "crypto";
import { IncomingMessage } from "http";
import { TextDecoder } from "util";
import type { WebSocket } from "ws";
import { NodeWebSocket } from "./NodeWebSocket";

export type NodePlatformOptions =
    | { persistance?: undefined; pubSub?: undefined }
    | {
          persistance: AbstractPersistance;
          pubSub: AbstractPubSub;
      };

export class NodePlatform extends AbstractPlatform<
    WebSocket,
    { req: IncomingMessage }
> {
    constructor(options: NodePlatformOptions = {}) {
        const { persistance, pubSub } = options;

        super(persistance && pubSub ? { persistance, pubSub } : {});
    }

    public convertWebSocket(
        webSocket: WebSocket,
        config: ConvertWebSocketConfig,
    ): NodeWebSocket {
        const { room } = config;

        return new NodeWebSocket(webSocket, { room });
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

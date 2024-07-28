import type {
    AbstractPersistance,
    AbstractPlatformConfig,
    AbstractPubSub,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import crypto from "node:crypto";
import { TextDecoder } from "node:util";
import type { WebSocket } from "ws";
import { NodeWebSocket } from "./NodeWebSocket";

export type NodePlatformOptions = { mode?: WebSocketRegistrationMode } & (
    | { persistance?: undefined; pubSub?: undefined }
    | { persistance: AbstractPersistance; pubSub: AbstractPubSub }
);

export class NodePlatform extends AbstractPlatform<WebSocket> {
    readonly _registrationMode: WebSocketRegistrationMode;

    constructor(options: NodePlatformOptions = {}) {
        const { mode = "attached", persistance, pubSub } = options;

        super(persistance && pubSub ? { persistance, pubSub } : {});

        this._registrationMode = mode;
    }

    public acceptWebSocket(webSocket: NodeWebSocket): Promise<void> {
        return Promise.resolve(undefined);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): NodeWebSocket {
        return new NodeWebSocket(webSocket, config);
    }

    public getLastPing(webSocket: NodeWebSocket): number | null {
        return null;
    }

    public getSessionId(webSocket: WebSocket): string | null {
        return null;
    }

    public getWebSockets(): readonly WebSocket[] {
        return [];
    }

    public initialize(config: AbstractPlatformConfig<{}, {}>): NodePlatform {
        return new NodePlatform()._initialize();
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

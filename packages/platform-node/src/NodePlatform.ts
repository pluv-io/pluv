import type {
    AbstractPersistance,
    AbstractPlatformConfig,
    AbstractPubSub,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
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

export class NodePlatform extends AbstractPlatform<NodeWebSocket> {
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
        const { room } = config;

        return new NodeWebSocket(webSocket, { persistance: this.persistance, room });
    }

    public getLastPing(webSocket: NodeWebSocket): number | null {
        return null;
    }

    public getSerializedState(webSocket: NodeWebSocket): WebSocketSerializedState | null {
        return null;
    }

    public getSessionId(webSocket: NodeWebSocket): string | null {
        return null;
    }

    public getWebSockets(): readonly WebSocket[] {
        return [];
    }

    public initialize(config: AbstractPlatformConfig<{}, {}>): this {
        return new NodePlatform({
            mode: this._registrationMode,
            persistance: this.persistance,
            pubSub: this.pubSub,
            ...config,
        } as NodePlatformOptions)._initialize() as this;
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        if (typeof data === "string") return JSON.parse(data);

        const decoder = new TextDecoder("utf8");

        return JSON.parse(decoder.decode(data));
    }

    public randomUUID(): string {
        return crypto.randomUUID();
    }

    public setSerializedState(webSocket: NodeWebSocket, state: WebSocketSerializedState): void {
        return;
    }
}

import type {
    AbstractPersistence,
    AbstractPlatformConfig,
    AbstractPubSub,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import type { Json } from "@pluv/types";
import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";
import { TextDecoder } from "node:util";
import type { WebSocket } from "ws";
import { NodeWebSocket } from "./NodeWebSocket";

export type NodePlatformRoomContext<TMeta extends Record<string, Json>> = keyof TMeta extends never
    ? { meta?: undefined }
    : { meta: TMeta };

export type NodePlatformConfig<TMeta extends Record<string, Json>> = { mode?: WebSocketRegistrationMode } & (
    | { persistence?: undefined; pubSub?: undefined }
    | { persistence: AbstractPersistence; pubSub: AbstractPubSub }
) & { context?: NodePlatformRoomContext<TMeta> };

export class NodePlatform<TMeta extends Record<string, Json> = {}> extends AbstractPlatform<
    NodeWebSocket,
    { req: IncomingMessage },
    NodePlatformRoomContext<TMeta>,
    {
        authorize: {
            secret: true;
        };
        handleMode: "io";
        requireAuth: false;
        registrationMode: WebSocketRegistrationMode;
        listeners: {
            onRoomDeleted: true;
            onRoomMessage: true;
            onStorageUpdated: true;
            onUserConnected: true;
            onUserDisconnected: true;
        };
    }
> {
    public readonly _config;
    public readonly _name = "platformNode";

    constructor(config: NodePlatformConfig<TMeta> = {}) {
        const { context, mode = "attached", persistence, pubSub } = config;

        super({
            context,
            ...(persistence && pubSub ? { persistence, pubSub } : {}),
        });

        this._config = {
            authorize: {
                secret: true as const,
            },
            handleMode: "io" as const,
            registrationMode: mode,
            requireAuth: false as const,
            listeners: {
                onRoomDeleted: true as const,
                onRoomMessage: true as const,
                onStorageUpdated: true as const,
                onUserConnected: true as const,
                onUserDisconnected: true as const,
            },
        };
    }

    public acceptWebSocket(webSocket: NodeWebSocket): Promise<void> {
        return Promise.resolve(undefined);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): NodeWebSocket {
        const { room } = config;

        return new NodeWebSocket(webSocket, { persistence: this.persistence, room });
    }

    public getLastPing(webSocket: NodeWebSocket): number | null {
        return null;
    }

    public getSerializedState(webSocket: WebSocket): WebSocketSerializedState | null {
        return null;
    }

    public getSessionId(webSocket: WebSocket): string | null {
        return null;
    }

    public getWebSockets(): readonly WebSocket[] {
        return [];
    }

    public initialize(config: AbstractPlatformConfig<NodePlatformRoomContext<TMeta>>): this {
        return new NodePlatform({
            context: config.context,
            mode: this._config.registrationMode,
            persistence: this.persistence,
            pubSub: this.pubSub,
        } as NodePlatformConfig<TMeta>)._initialize() as this;
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

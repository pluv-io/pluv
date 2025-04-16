import type {
    AbstractPersistence,
    AbstractPlatformConfig,
    AbstractPubSub,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import type { IOAuthorize, Json } from "@pluv/types";
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
) & { roomContext?: NodePlatformRoomContext<TMeta> };

export class NodePlatform<
    TAuthorize extends IOAuthorize<any, any> | null = null,
    TMeta extends Record<string, Json> = {},
> extends AbstractPlatform<
    NodeWebSocket<TAuthorize>,
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
        router: true;
    }
> {
    public readonly _config;
    public readonly _name = "platformNode";

    constructor(config: NodePlatformConfig<TMeta> = {}) {
        const { roomContext, mode = "attached", persistence, pubSub } = config;

        super({
            roomContext,
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
            router: true as const,
        };
    }

    public acceptWebSocket(webSocket: NodeWebSocket<TAuthorize>): Promise<void> {
        return Promise.resolve(undefined);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): NodeWebSocket<TAuthorize> {
        const { room } = config;

        return new NodeWebSocket<TAuthorize>(webSocket, { persistence: this.persistence, platform: this, room });
    }

    public getLastPing(webSocket: NodeWebSocket<TAuthorize>): number | null {
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
            roomContext: config.roomContext,
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

    public setSerializedState(
        webSocket: NodeWebSocket<TAuthorize>,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        webSocket.state = state;

        return webSocket.state;
    }
}

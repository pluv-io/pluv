import type {
    AbstractPersistence,
    AbstractPlatformConfig,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import type { Json } from "@pluv/types";
import crypto from "node:crypto";
import { TextDecoder } from "node:util";
import type { WebSocket } from "ws";
import { NodeWebSocket } from "./NodeWebSocket";
import type { NodeRegisterInput } from "./types";
import { toRequest } from "./utils/toRequest";

export type NodePlatformRoomContext<TMeta extends Record<string, Json>> = keyof TMeta extends never
    ? { meta?: undefined }
    : { meta: TMeta };

export type NodePlatformConfig<TMeta extends Record<string, Json>> = {
    mode?: WebSocketRegistrationMode;
    origin?: string;
    persistence?: AbstractPersistence;
    roomContext?: NodePlatformRoomContext<TMeta>;
};

export class NodePlatform<TMeta extends Record<string, Json> = {}> extends AbstractPlatform<
    NodeWebSocket,
    NodeRegisterInput,
    NodePlatformRoomContext<TMeta>,
    {
        authorize: {
            secret: true;
        };
        handleMode: "io";
        registrationMode: WebSocketRegistrationMode;
        listeners: "all";
        router: true;
    }
> {
    public readonly id = crypto.randomUUID();
    public readonly _config;
    public readonly _name = "platformNode";
    public readonly origin: string | undefined;

    constructor(config: NodePlatformConfig<TMeta> = {}) {
        const { origin, roomContext, mode = "attached", persistence } = config;

        super({
            roomContext,
            ...(persistence ? { persistence } : {}),
        });

        this.origin = origin;

        this._config = {
            authorize: {
                secret: true as const,
            },
            handleMode: "io" as const,
            registrationMode: mode,
            listeners: "all" as const,
            router: true as const,
        };
    }

    public acceptWebSocket(webSocket: NodeWebSocket): Promise<void> {
        return Promise.resolve(undefined);
    }

    public convertWebSocket(webSocket: WebSocket, config: ConvertWebSocketConfig): NodeWebSocket {
        const { room } = config;

        return new NodeWebSocket(webSocket, {
            persistence: this.persistence,
            platform: this,
            room,
        });
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
            mode: this._config.registrationMode,
            origin: this.origin,
            persistence: this.persistence.initialize(config.roomContext),
            roomContext: config.roomContext,
        })._initialize() as this;
    }

    public normalizeInitContext(initContext: NodeRegisterInput): NodeRegisterInput {
        return {
            request: toRequest(initContext.request, { origin: this.origin }),
        };
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
        webSocket: NodeWebSocket,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        webSocket.state = state;

        return webSocket.state;
    }
}

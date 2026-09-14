import type {
    AbstractPlatformConfig,
    ConvertWebSocketConfig,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import type { Json } from "@pluv/types";
import { CloudflareWebSocket } from "./CloudflareWebSocket";

export type CloudflarePlatformRoomContext<
    TEnv extends Record<string, any>,
    TMeta extends Record<string, Json>,
> = {
    env: TEnv;
    state: DurableObjectState;
} & (keyof TMeta extends never ? { meta?: undefined } : { meta: TMeta });

export type CloudflarePlatformConfig<
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
> = AbstractPlatformConfig<CloudflarePlatformRoomContext<TEnv, TMeta>>;

export class CloudflarePlatform<
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
> extends AbstractPlatform<
    CloudflareWebSocket,
    { env: TEnv; request: Request },
    CloudflarePlatformRoomContext<TEnv, TMeta>,
    {
        authorize: {
            secret: true;
        };
        handleMode: "io";
        registrationMode: "detached";
        listeners: "all";
        router: true;
    }
> {
    public readonly id = crypto.randomUUID();
    public readonly _config;
    public readonly _name = "platformCloudflare";

    private readonly _persistenceProvided: boolean;

    constructor(config: CloudflarePlatformConfig<TEnv, TMeta>) {
        super({
            ...config,
            ...(config.roomContext
                ? {
                      persistence:
                          config.persistence ??
                          new PersistenceCloudflareTransactionalStorage({ mode: "sqlite" }),
                  }
                : {}),
        });

        this._persistenceProvided = !!config.persistence;

        this._config = {
            authorize: {
                secret: true as const,
            },
            handleMode: "io" as const,
            registrationMode: "detached" as const,
            listeners: "all" as const,
            router: true as const,
        };

        const state = this._getDurableObjectState();

        if (!state) return;

        state.setWebSocketAutoResponse(
            new WebSocketRequestResponsePair(
                '{"type":"$ping","data":{}}',
                JSON.stringify({ type: "$pong", data: {} }),
            ),
        );
    }

    public async acceptWebSocket(webSocket: CloudflareWebSocket): Promise<void> {
        const state = this._getDurableObjectState();

        if (!state) {
            throw new Error(
                "Cloudflare platform requires DurableObjectState for WebSocket hibernation",
            );
        }

        state.acceptWebSocket(webSocket.webSocket);
    }

    public convertWebSocket(
        webSocket: WebSocket,
        config: ConvertWebSocketConfig,
    ): CloudflareWebSocket {
        const { room } = config;

        return new CloudflareWebSocket(webSocket, {
            persistence: this.persistence,
            platform: this,
            room,
        });
    }

    public getLastPing(webSocket: CloudflareWebSocket): number | null {
        const state = this._getDurableObjectState();

        if (!state) return null;

        const timestamp = state.getWebSocketAutoResponseTimestamp(webSocket.webSocket);

        return timestamp?.getTime() ?? null;
    }

    public getSerializedState(webSocket: WebSocket): WebSocketSerializedState | null {
        const deserialized = webSocket.deserializeAttachment();

        return deserialized?.state ?? null;
    }

    public getSessionId(webSocket: WebSocket): string | null {
        const deserialized = webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId;

        if (typeof sessionId !== "string") return null;

        return sessionId;
    }

    public getWebSockets(): readonly WebSocket[] {
        const state = this._getDurableObjectState();

        if (!state) return [];

        const webSockets = state.getWebSockets() ?? [];

        return webSockets;
    }

    public initialize(
        config: AbstractPlatformConfig<CloudflarePlatformRoomContext<TEnv, TMeta>>,
    ): this {
        const ctx = config.roomContext ?? { ...this._roomContext };

        if (!ctx.env || !ctx.state) throw new Error("Could not derive platform roomContext");

        const roomContext = {
            env: ctx.env,
            meta: ctx.meta,
            state: ctx.state,
        } as CloudflarePlatformRoomContext<TEnv, TMeta>;

        const persistence = (
            this._persistenceProvided
                ? this.persistence
                : new PersistenceCloudflareTransactionalStorage({ mode: "sqlite" })
        ).initialize(roomContext);

        return new CloudflarePlatform<TEnv, TMeta>({
            roomContext,
            persistence,
            pubSub: this.pubSub,
        })._initialize() as this;
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
        webSocket: CloudflareWebSocket,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        const deserialized = webSocket.webSocket.deserializeAttachment() ?? {};

        webSocket.webSocket.serializeAttachment({ ...deserialized, state });

        return state;
    }

    private _getDurableObjectState(): DurableObjectState | null {
        return this._roomContext?.state ?? null;
    }
}

import type {
    AbstractPlatformConfig,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import type { IOAuthorize, Json } from "@pluv/types";
import { CloudflareWebSocket } from "./CloudflareWebSocket";
import { DEFAULT_REGISTRATION_MODE } from "./constants";

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
> = AbstractPlatformConfig<CloudflarePlatformRoomContext<TEnv, TMeta>> & {
    mode?: WebSocketRegistrationMode;
};

export class CloudflarePlatform<
    TAuthorize extends IOAuthorize<any, any> | null = null,
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
> extends AbstractPlatform<
    CloudflareWebSocket<TAuthorize>,
    { env: TEnv; request: Request },
    CloudflarePlatformRoomContext<TEnv, TMeta>,
    {
        authorize: {
            secret: true;
        };
        handleMode: "io";
        requireAuth: false;
        registrationMode: WebSocketRegistrationMode;
        listeners: {
            onRoomDestroyed: true;
            onRoomMessage: true;
            onStorageDestroyed: true;
            onStorageUpdated: true;
            onUserConnected: true;
            onUserDisconnected: true;
        };
        router: true;
    }
> {
    public readonly id = crypto.randomUUID();
    public readonly _config;
    public readonly _name = "platformCloudflare";

    constructor(config: CloudflarePlatformConfig<TEnv, TMeta>) {
        super({
            ...config,
            ...(config.roomContext && config.mode === "detached"
                ? {
                      persistence:
                          config.persistence ??
                          new PersistenceCloudflareTransactionalStorage({ mode: "sqlite" }),
                  }
                : {}),
        });

        this._config = {
            authorize: {
                secret: true as const,
            },
            handleMode: "io" as const,
            registrationMode: config.mode ?? DEFAULT_REGISTRATION_MODE,
            requireAuth: false as const,
            listeners: {
                onRoomDestroyed: true as const,
                onRoomMessage: true as const,
                onStorageDestroyed: true as const,
                onStorageUpdated: true as const,
                onUserConnected: true as const,
                onUserDisconnected: true as const,
            },
            router: true as const,
        };

        const detachedState = this._getDetachedState();

        if (!detachedState) return;

        detachedState.setWebSocketAutoResponse(
            new WebSocketRequestResponsePair(
                '{"type":"$ping","data":{}}',
                JSON.stringify({ type: "$pong", data: {} }),
            ),
        );
    }

    public async acceptWebSocket(webSocket: CloudflareWebSocket<TAuthorize>): Promise<void> {
        const detachedState = this._getDetachedState();

        if (!detachedState) {
            webSocket.webSocket.accept();

            return;
        }

        detachedState.acceptWebSocket(webSocket.webSocket);
    }

    public convertWebSocket(
        webSocket: WebSocket,
        config: ConvertWebSocketConfig,
    ): CloudflareWebSocket<TAuthorize> {
        const { room } = config;

        return new CloudflareWebSocket<TAuthorize>(webSocket, {
            persistence: this.persistence,
            platform: this,
            room,
        });
    }

    public getLastPing(webSocket: CloudflareWebSocket<TAuthorize>): number | null {
        const detachedState = this._getDetachedState();

        if (!detachedState) return null;

        const timestamp = detachedState.getWebSocketAutoResponseTimestamp(webSocket.webSocket);

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
        const detachedState = this._getDetachedState();

        if (!detachedState) return [];

        const webSockets = detachedState.getWebSockets() ?? [];

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

        return new CloudflarePlatform<TAuthorize, TEnv, TMeta>({
            roomContext,
            mode: this._config.registrationMode,
            persistence: this.persistence.initialize(roomContext),
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
        webSocket: CloudflareWebSocket<TAuthorize>,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        const deserialized = webSocket.webSocket.deserializeAttachment() ?? {};

        webSocket.webSocket.serializeAttachment({ ...deserialized, state });

        return state;
    }

    private _getDetachedState(): DurableObjectState | null {
        if (this._config.registrationMode !== "detached") return null;

        const detachedState = this._roomContext?.state ?? null;

        return detachedState;
    }
}

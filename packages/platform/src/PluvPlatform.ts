import type {
    AbstractPersistence,
    AbstractPlatformConfig,
    ConvertWebSocketConfig,
    WebSocketSerializedState,
} from "@pluv/io";
import { AbstractPlatform } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { PluvWebSocket } from "./PluvWebSocket";
import type { PluvRoomContext, PluvRoomState, PluvSocket } from "./types";

export type PluvPlatformConfig = AbstractPlatformConfig<PluvRoomContext> & {
    persistence?: AbstractPersistence;
};

const hasSql = (state: PluvRoomState | undefined): boolean => !!state?.storage?.sql;

export class PluvPlatform extends AbstractPlatform<
    PluvWebSocket,
    {},
    PluvRoomContext,
    {
        authorize: { secret: true };
        handleMode: "io";
        listeners: "all";
        router: true;
    }
> {
    public readonly id = crypto.randomUUID();
    public readonly _config;
    public readonly _name = "platformPluv";

    private readonly _persistenceProvided: boolean;

    constructor(config: PluvPlatformConfig = {}) {
        super(config);

        this._persistenceProvided = !!config.persistence;
        this._config = {
            authorize: { secret: true as const },
            handleMode: "io" as const,
            listeners: "all" as const,
            router: true as const,
        };
    }

    public acceptWebSocket(_webSocket: PluvWebSocket): Promise<void> {
        return Promise.reject(new Error("The room facet does not accept sockets."));
    }

    public convertWebSocket(webSocket: PluvSocket, config: ConvertWebSocketConfig): PluvWebSocket {
        return new PluvWebSocket(webSocket, {
            persistence: this.persistence,
            platform: this,
            room: config.room,
        });
    }

    public getLastPing(webSocket: PluvWebSocket): number | null {
        return webSocket.webSocket.lastPing;
    }

    public getSerializedState(_webSocket: PluvSocket): WebSocketSerializedState | null {
        return null;
    }

    public getSessionId(webSocket: PluvSocket): string | null {
        return webSocket.id;
    }

    public getWebSockets(): readonly PluvSocket[] {
        return this._roomContext?.sessions ?? [];
    }

    public initialize(config: AbstractPlatformConfig<PluvRoomContext>): this {
        const roomContext: PluvRoomContext = {
            env: config.roomContext?.env ?? {},
            sessions: config.roomContext?.sessions ?? [],
            state: config.roomContext?.state ?? {},
        };
        const persistence = (
            this._persistenceProvided
                ? this.persistence
                : hasSql(roomContext.state)
                  ? new PersistenceCloudflareTransactionalStorage()
                  : this.persistence
        ).initialize(roomContext);

        return new PluvPlatform({
            persistence,
            pubSub: this.pubSub,
            roomContext,
        })._initialize() as this;
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        if (typeof data === "string") return JSON.parse(data);

        return JSON.parse(new TextDecoder("utf8").decode(data));
    }

    public randomUUID(): string {
        return crypto.randomUUID();
    }

    public setSerializedState(
        webSocket: PluvWebSocket,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState {
        webSocket.state = state;

        return state;
    }

    public override keepAlive(promise: Promise<unknown>): void {
        super.keepAlive(promise);
        this._roomContext?.state?.waitUntil?.(promise);
    }
}

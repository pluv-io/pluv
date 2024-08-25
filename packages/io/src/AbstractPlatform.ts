import type { AbstractPersistence } from "./AbstractPersistence";
import type { AbstractPubSub } from "./AbstractPubSub";
import type { AbstractWebSocket, InferWebSocketSource } from "./AbstractWebSocket";
import { Persistence } from "./Persistence";
import { PubSub } from "./PubSub";
import type { WebSocketSerializedState } from "./types";

export type WebSocketRegistrationMode = "attached" | "detached";

export type InferPlatformWebSocketType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<infer IAbstractWebSocket> ? IAbstractWebSocket : never;

export type InferPlatformWebSocketSource<TPlatform> =
    TPlatform extends AbstractPlatform<infer IAbstractWebSocket> ? InferWebSocketSource<IAbstractWebSocket> : never;

export type InferPlatformContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, infer IPlatformContext> ? IPlatformContext : never;

export type InferRoomContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, infer IPlatformContext, infer IRoomContext>
        ? IPlatformContext & IRoomContext
        : never;

export type AbstractPlatformConfig<
    TPlatformContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
> = {
    context?: TPlatformContext & TRoomContext;
    persistence?: AbstractPersistence;
    pubSub?: AbstractPubSub;
};

export interface ConvertWebSocketConfig {
    room: string;
}

export abstract class AbstractPlatform<
    TWebSocket extends AbstractWebSocket = AbstractWebSocket,
    TPlatformContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
> {
    protected readonly _ioContext: TPlatformContext | undefined;
    protected readonly _roomContext: TRoomContext | undefined;

    private _initialized: boolean = false;

    public persistence: AbstractPersistence;
    public pubSub: AbstractPubSub;

    public abstract readonly _registrationMode: WebSocketRegistrationMode;

    constructor(config: AbstractPlatformConfig<TPlatformContext, TRoomContext> = {}) {
        const { context, persistence, pubSub } = config;

        (this as any)._meta = (config as any)._meta;
        context && (this._ioContext = context);
        context && (this._roomContext = context);

        this.persistence = persistence ?? new Persistence();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract acceptWebSocket(webSocket: AbstractWebSocket): Promise<void>;

    public abstract convertWebSocket(
        webSocket: InferWebSocketSource<TWebSocket>,
        config: ConvertWebSocketConfig,
    ): AbstractWebSocket;

    public abstract getLastPing(webSocket: AbstractWebSocket): number | null;

    public abstract getSerializedState(webSocket: InferWebSocketSource<TWebSocket>): WebSocketSerializedState | null;

    public abstract getSessionId(webSocket: InferWebSocketSource<TWebSocket>): string | null;

    public abstract getWebSockets(): readonly InferWebSocketSource<TWebSocket>[];

    public abstract initialize(config: AbstractPlatformConfig<TPlatformContext, TRoomContext>): this;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;

    public abstract setSerializedState(webSocket: AbstractWebSocket, state: WebSocketSerializedState): void;

    protected _initialize(): this {
        if (this._initialized) throw new Error("Platform is already initialized");

        this._initialized = true;

        return this;
    }
}

import { AbstractPersistance } from "./AbstractPersistance";
import type { AbstractPubSub } from "./AbstractPubSub";
import type { AbstractWebSocket, AbstractWebSocketConfig } from "./AbstractWebSocket";
import { Persistance } from "./Persistance";
import { PubSub } from "./PubSub";

export type InferPlatformWebSocketType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<infer IWebSocket> ? IWebSocket : never;

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
    persistance?: AbstractPersistance;
    pubSub?: AbstractPubSub;
};

export type ConvertWebSocketConfig = AbstractWebSocketConfig;

export abstract class AbstractPlatform<
    TWebSocket = any,
    TPlatformContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
> {
    private _initialized: boolean = false;

    readonly _ioContext: TPlatformContext | undefined;
    readonly _roomContext: TRoomContext | undefined;

    public persistance: AbstractPersistance;
    public pubSub: AbstractPubSub;

    constructor(config: AbstractPlatformConfig<TPlatformContext, TRoomContext> = {}) {
        const { context, persistance, pubSub } = config;

        context && (this._ioContext = context);
        context && (this._roomContext = context);

        this.persistance = persistance ?? new Persistance();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract acceptWebSocket(webSocket: AbstractWebSocket): Promise<void>;

    public abstract convertWebSocket(webSocket: TWebSocket, config: ConvertWebSocketConfig): AbstractWebSocket;

    public abstract getLastPingTime(webSocket: AbstractWebSocket): number | null;

    public abstract getWebSockets(): readonly TWebSocket[];

    public abstract initialize(
        config: AbstractPlatformConfig<TPlatformContext, TRoomContext>,
    ): AbstractPlatform<TWebSocket, TPlatformContext, TRoomContext>;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;

    protected _initialize(): this {
        if (this._initialized) throw new Error("Platform is already initialized");

        this._initialized = true;

        return this;
    }
}

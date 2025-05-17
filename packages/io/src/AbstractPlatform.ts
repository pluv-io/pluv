import type { Maybe } from "@pluv/types";
import type { AbstractPersistence } from "./AbstractPersistence";
import type { AbstractPubSub } from "./AbstractPubSub";
import type { AbstractWebSocket, InferWebSocketSource } from "./AbstractWebSocket";
import type { JWTEncodeParams } from "./authorize";
import { Persistence } from "./Persistence";
import { PubSub } from "./PubSub";
import type { PlatformConfig, ResolvedPluvIOAuthorize, WebSocketSerializedState } from "./types";

export type InferPlatformWebSocketType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<infer IAbstractWebSocket> ? IAbstractWebSocket : never;

export type InferPlatformWebSocketSource<TPlatform> =
    TPlatform extends AbstractPlatform<infer IAbstractWebSocket>
        ? InferWebSocketSource<IAbstractWebSocket>
        : never;

export type InferInitContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, infer IInitContext> ? IInitContext : never;

export type InferRoomContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, any, infer IRoomContext> ? IRoomContext : never;

export type AbstractPlatformConfig<TRoomContext extends Record<string, any> = {}> = {
    persistence?: AbstractPersistence;
    pubSub?: AbstractPubSub;
    roomContext?: TRoomContext;
};

export interface ConvertWebSocketConfig {
    room: string;
}

export abstract class AbstractPlatform<
    TWebSocket extends AbstractWebSocket<any, any> = AbstractWebSocket<any, any>,
    TInitContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
    TConfig extends PlatformConfig = PlatformConfig,
> {
    protected readonly _initContext: TInitContext | undefined;
    protected readonly _roomContext: TRoomContext | undefined;

    private _initialized: boolean = false;

    public persistence: AbstractPersistence;
    public pubSub: AbstractPubSub;

    public readonly _createToken?: (
        params: JWTEncodeParams<any, any> & {
            authorize: Maybe<ResolvedPluvIOAuthorize<any, any>>;
        },
    ) => Promise<string>;
    public _fetch?: (...args: any[]) => Promise<any>;
    public abstract readonly _config: TConfig;
    public abstract readonly _name: string;

    constructor(config: AbstractPlatformConfig<TRoomContext> = {}) {
        const { roomContext, persistence, pubSub } = config;

        (this as any)._meta = (config as any)._meta;
        if (!!roomContext) this._roomContext = roomContext;

        this.persistence = persistence ?? new Persistence();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract acceptWebSocket(webSocket: AbstractWebSocket): Promise<void>;

    public abstract convertWebSocket(
        webSocket: InferWebSocketSource<TWebSocket>,
        config: ConvertWebSocketConfig,
    ): AbstractWebSocket<any, any>;

    public abstract getLastPing(webSocket: AbstractWebSocket<any, any>): number | null;

    public abstract getSerializedState(
        webSocket: InferWebSocketSource<TWebSocket>,
    ): WebSocketSerializedState | null;

    public abstract getSessionId(webSocket: InferWebSocketSource<TWebSocket>): string | null;

    public abstract getWebSockets(): readonly InferWebSocketSource<TWebSocket>[];

    public abstract initialize(config: AbstractPlatformConfig<TRoomContext>): this;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;

    public abstract setSerializedState(
        webSocket: AbstractWebSocket,
        state: WebSocketSerializedState,
    ): WebSocketSerializedState;

    public validateConfig(config: any): void {}

    protected _initialize(): this {
        if (this._initialized) throw new Error("Platform is already initialized");

        this._initialized = true;

        return this;
    }
}

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

export type AbstractPlatformConfig =
    | { persistance?: undefined; pubSub?: undefined }
    | { persistance: AbstractPersistance; pubSub: AbstractPubSub };

export type ConvertWebSocketConfig = AbstractWebSocketConfig;

export abstract class AbstractPlatform<
    TWebSocket = any,
    TPlatformContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
> {
    readonly _ioContext: TPlatformContext | undefined;
    readonly _roomContext: TRoomContext | undefined;

    public persistance: AbstractPersistance;
    public pubSub: AbstractPubSub;

    constructor(config: AbstractPlatformConfig = {}) {
        const { persistance, pubSub } = config;

        this.persistance = persistance ?? new Persistance();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract convertWebSocket(webSocket: TWebSocket, config: ConvertWebSocketConfig): AbstractWebSocket;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;
}

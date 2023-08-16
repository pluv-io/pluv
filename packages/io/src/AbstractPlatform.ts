import { AbstractPersistance } from "./AbstractPersistance";
import type { AbstractPubSub } from "./AbstractPubSub";
import type {
    AbstractWebSocket,
    AbstractWebSocketConfig,
} from "./AbstractWebSocket";
import { Persistance } from "./Persistance";
import { PubSub } from "./PubSub";

export type InferPlatformWebSocketType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<infer IWebSocket> ? IWebSocket : never;

export type InferPlatformRoomContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, infer IIOContext>
        ? IIOContext
        : never;

export type InferPlatformEventContextType<TPlatform extends AbstractPlatform> =
    TPlatform extends AbstractPlatform<any, any, infer IRoomContext>
        ? IRoomContext
        : never;

export type AbstractPlatformConfig =
    | { persistance?: undefined; pubSub?: undefined }
    | {
          persistance: AbstractPersistance;
          pubSub: AbstractPubSub;
      };

export type ConvertWebSocketConfig = AbstractWebSocketConfig;

export abstract class AbstractPlatform<
    TWebSocket = any,
    TIOContext extends Record<string, any> = {},
    TRoomContext extends Record<string, any> = {},
> {
    readonly _ioContext: TIOContext | undefined;
    readonly _roomContext: TRoomContext | undefined;

    public persistance: AbstractPersistance;
    public pubSub: AbstractPubSub;

    constructor(config: AbstractPlatformConfig = {}) {
        const { persistance, pubSub } = config;

        this.persistance = persistance ?? new Persistance();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract convertWebSocket(
        webSocket: TWebSocket,
        config: ConvertWebSocketConfig,
    ): AbstractWebSocket;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;
}

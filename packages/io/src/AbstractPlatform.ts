import { AbstractPersistance } from "./AbstractPersistance";
import type { AbstractPubSub } from "./AbstractPubSub";
import type { AbstractWebSocket } from "./AbstractWebSocket";
import { Persistance } from "./Persistance";
import { PubSub } from "./PubSub";

export type InferWebSocketType<TPlatform extends AbstractPlatform<any>> =
    TPlatform extends AbstractPlatform<infer IWebSocket> ? IWebSocket : never;

export type AbstractPlatformConfig =
    | { persistance?: undefined; pubSub?: undefined }
    | {
          persistance: AbstractPersistance;
          pubSub: AbstractPubSub;
      };

export interface ConvertWebSocketConfig {
    room: string;
}

export abstract class AbstractPlatform<TWebSocket = any> {
    public persistance: AbstractPersistance;
    public pubSub: AbstractPubSub;

    constructor(config: AbstractPlatformConfig = {}) {
        const { persistance, pubSub } = config;

        this.persistance = persistance ?? new Persistance();
        this.pubSub = pubSub ?? new PubSub();
    }

    public abstract convertWebSocket(
        webSocket: TWebSocket,
        config: ConvertWebSocketConfig
    ): AbstractWebSocket;

    public abstract parseData(data: string | ArrayBuffer): Record<string, any>;

    public abstract randomUUID(): string;
}

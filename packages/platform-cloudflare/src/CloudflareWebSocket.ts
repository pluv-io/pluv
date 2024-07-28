import type { AbstractEventMap, AbstractListener, AbstractWebSocketConfig } from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";

export interface CloudflareWebSocketEventMap {
    close: CloseEvent;
    message: MessageEvent;
    open: Event;
    error: ErrorEvent;
}

export type CloudflareWebSocketConfig = AbstractWebSocketConfig;

export class CloudflareWebSocket extends AbstractWebSocket {
    public webSocket: WebSocket;

    public get readyState(): 0 | 1 | 2 | 3 {
        return this.webSocket.readyState as 0 | 1 | 2 | 3;
    }

    public get sessionId(): string {
        const deserialized = this.webSocket.deserializeAttachment() ?? {};
        const sessionId = deserialized.sessionId ?? crypto.randomUUID();

        this.webSocket.serializeAttachment({ ...deserialized, sessionId });

        return sessionId;
    }

    constructor(webSocket: WebSocket, config: CloudflareWebSocketConfig) {
        const { room, userId } = config;

        super({ room, userId });

        this.webSocket = webSocket;
    }

    public addEventListener<TType extends keyof AbstractEventMap>(type: TType, handler: AbstractListener<TType>) {
        this.webSocket.addEventListener(type, handler as any);
    }

    public close(code?: number | undefined, reason?: string | undefined): void {
        const canClose = [this.CONNECTING, this.OPEN].some((readyState) => readyState === this.readyState);

        if (!canClose) return;

        this.webSocket.close(code, reason);
    }

    public initialize(): Promise<() => undefined> {
        this.webSocket.accept();

        return Promise.resolve(() => undefined);
    }

    public send(message: string | ArrayBuffer | ArrayBufferView): void {
        if (this.readyState !== this.OPEN) return;

        this.webSocket.send(message);
    }

    public terminate(): void {
        return this.webSocket.close(1011, "Terminated");
    }
}

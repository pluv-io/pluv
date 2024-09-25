import {
    AbstractPlatform,
    AbstractPlatformConfig,
    AbstractWebSocket,
    ConvertWebSocketConfig,
    WebSocketRegistrationMode,
    WebSocketSerializedState,
} from "@pluv/io";

export class PluvPlatform extends AbstractPlatform {
    _registrationMode: WebSocketRegistrationMode = "attached";

    public acceptWebSocket(webSocket: AbstractWebSocket): Promise<void> {
        throw new Error("Not implemented");
    }

    public convertWebSocket(webSocket: any, config: ConvertWebSocketConfig): AbstractWebSocket {
        throw new Error("Not implemented");
    }

    public getLastPing(webSocket: AbstractWebSocket): number | null {
        throw new Error("Not implemented");
    }

    public getSerializedState(webSocket: any): WebSocketSerializedState | null {
        throw new Error("Not implemented");
    }

    public getSessionId(webSocket: any): string | null {
        throw new Error("Not implemented");
    }

    public getWebSockets(): readonly any[] {
        throw new Error("Not implemented");
    }

    public initialize(config: AbstractPlatformConfig<{}, {}>): this {
        throw new Error("Not implemented");
    }

    public parseData(data: string | ArrayBuffer): Record<string, any> {
        throw new Error("Not implemented");
    }

    public randomUUID(): string {
        throw new Error("Not implemented");
    }

    public setSerializedState(webSocket: AbstractWebSocket, state: WebSocketSerializedState): void {
        throw new Error("Not implemented");
    }
}

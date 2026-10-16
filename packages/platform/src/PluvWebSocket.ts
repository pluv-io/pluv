import type {
    AbstractEventMap,
    AbstractListener,
    AbstractWebSocketConfig,
    WebSocketSerializedState,
    WebSocketSession,
} from "@pluv/io";
import { AbstractWebSocket } from "@pluv/io";
import type { BaseUser, JsonObject } from "@pluv/types";
import type { PluvSocket } from "./types";

export class PluvWebSocket extends AbstractWebSocket<PluvSocket> {
    private _readyState: 0 | 1 | 2 | 3 = this.OPEN;
    private _sessionId: string | null = null;
    private _state: WebSocketSerializedState;
    private _user: BaseUser | null = null;

    public set presence(presence: JsonObject | null) {
        this._state.presence = presence;
    }

    public get readyState(): 0 | 1 | 2 | 3 {
        return this._readyState;
    }

    public get session(): WebSocketSession<any> {
        const user = this._user;

        if (!user) throw new Error("WebSocket is not authorized");

        return {
            ...this._state,
            id: this.sessionId,
            user,
            webSocket: this,
        };
    }

    public get sessionId(): string {
        if (this._sessionId) return this._sessionId;

        this._sessionId = this.webSocket.id;

        return this._sessionId;
    }

    public get state(): WebSocketSerializedState {
        return this._state;
    }

    public set state(state: WebSocketSerializedState) {
        this._state = state;
    }

    public get user(): BaseUser | null {
        return this._user;
    }

    public set user(user: BaseUser) {
        this._user = user;
    }

    constructor(webSocket: PluvSocket, config: AbstractWebSocketConfig) {
        super(webSocket, config);

        this._state = {
            kind: "user",
            operator: null,
            presence: null,
            quit: false,
            room: config.room,
            seq: { presence: null },
            timers: { ping: webSocket.lastPing ?? Date.now() },
        };
    }

    public addEventListener<TType extends keyof AbstractEventMap>(
        _type: TType,
        _handler: AbstractListener<TType>,
    ): void {}

    public close(_code?: number, _reason?: string): void {
        throw new Error("The room facet does not accept sockets.");
    }

    public send(_message: ArrayBuffer | ArrayBufferView | string): void {
        throw new Error("The room facet does not accept sockets.");
    }

    public terminate(): void {
        throw new Error("The room facet does not accept sockets.");
    }
}

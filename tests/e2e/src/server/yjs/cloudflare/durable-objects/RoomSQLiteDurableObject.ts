import type { InferIORoom } from "@pluv/io";
import { DurableObject } from "cloudflare:workers";
import { ioServer } from "../pluv-io/sqlite";

const GARBAGE_COLLECT_INTERVAL_MS = 30_000;

export class RoomSQLiteDurableObject extends DurableObject<CloudflareEnv> {
    private _room: InferIORoom<typeof ioServer>;

    constructor(state: DurableObjectState, env: CloudflareEnv) {
        super(state, env);

        this._room = ioServer.createRoom(state.id.toString(), { env, state });
    }

    public async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
        const onCloseHandler = this._room.onClose(ws);

        await onCloseHandler({ code, reason });
    }

    public async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        const onErrorHandler = this._room.onError(ws);
        const eventError = error instanceof Error ? error : new Error("Internal Error");

        await onErrorHandler({ error: eventError, message: eventError.message });
    }

    public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        const onMessageHandler = this._room.onMessage(ws);

        await onMessageHandler({ data: message });
    }

    async fetch(request: Request<any, CfProperties<any>>): Promise<Response> {
        const isWSRequest = request.headers.get("Upgrade") === "websocket";

        if (!isWSRequest) return new Response("Expected websocket", { status: 400 });

        const { 0: client, 1: server } = new WebSocketPair();
        const token = new URL(request.url).searchParams.get("token");

        const alarm = await this.ctx.storage.getAlarm();
        if (alarm !== null) await this.ctx.storage.setAlarm(Date.now() + GARBAGE_COLLECT_INTERVAL_MS);

        await this._room.register(server, { env: this.env, request, token });

        return new Response(null, { status: 101, webSocket: client });
    }

    public async alarm(alarmInfo?: AlarmInvocationInfo): Promise<void> {
        await this._room.garbageCollect();
        await this.ctx.storage.setAlarm(Date.now() + GARBAGE_COLLECT_INTERVAL_MS);
    }
}

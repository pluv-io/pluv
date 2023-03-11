import { RequestUtils, WebSocketUtils } from "@pluv-internal/cloudflare-utils";
import type { InferIORoom } from "@pluv/io";
import { io } from "../pluv-io";

export class RoomDurableObject implements DurableObject {
    private _io: InferIORoom<typeof io>;

    constructor(state: DurableObjectState) {
        this._io = io.getRoom(state.id.toString());
    }

    async fetch(request: Request): Promise<Response> {
        if (!RequestUtils.isWebSocketRequest(request)) {
            return new Response("Expected websocket", { status: 400 });
        }

        const [client, server] = WebSocketUtils.makeWebSocketPair();

        await this._io.register(server);

        return new Response(null, { status: 101, webSocket: client });
    }
}

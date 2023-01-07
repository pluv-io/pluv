import {
    createRouter,
    RequestUtils,
    WebSocketUtils,
} from "@pluv-internal/cloudflare-utils";
import type { InferIORoom } from "@pluv/io";
import { io } from "../pluv-io";

const router = createRouter<{
    ioRoom: InferIORoom<typeof io>;
}>().path(
    "get",
    "/websocket",
    async (_, { context: { ioRoom }, query, request }) => {
        const token = query.token as string | undefined;

        if (!RequestUtils.isWebSocketRequest(request)) {
            return new Response("Expected websocket", { status: 400 });
        }

        const [client, server] = WebSocketUtils.makeWebSocketPair();

        await ioRoom.register(server, { token });

        return new Response(null, { status: 101, webSocket: client });
    }
);

export class RoomDurableObject implements DurableObject {
    private _io: InferIORoom<typeof io>;
    private _router = router;

    constructor(state: DurableObjectState) {
        this._io = io.getRoom(state.id.toString());

        this._router.setConfig({ context: { ioRoom: this._io } });
    }

    async fetch(request: Request): Promise<Response> {
        return await RequestUtils.handleErrors(request, async () => {
            return await this._router.match(request);
        });
    }
}

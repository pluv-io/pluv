import { Hono } from "hono";
import { cors } from "hono/cors";
import { ioServer } from "./user-server";
import type { PlatformEnv } from "./supervisor";

export { RoomSupervisor } from "./supervisor";

const app = new Hono<{ Bindings: PlatformEnv }>()
    .use(cors({ origin: "*" }))
    .get("/api/pluv/room/:roomId", async (c) => {
        const { roomId } = c.req.param();

        if (!roomId) return c.text("Not found", 404);

        const room = c.env.rooms.get(c.env.rooms.idFromName(roomId));

        return await room.fetch(c.req.raw);
    })
    .get("/api/pluv/authorize", async (c) => {
        const roomId = c.req.query("room");

        if (!roomId) return c.text("Not found", 404);

        const userId = c.req.query("user_id") ?? crypto.randomUUID();
        const token = await ioServer.createToken({
            room: roomId,
            user: { id: userId, name: `name:${userId}` },
        });

        return c.text(token, 200);
    });

const handler: ExportedHandler<PlatformEnv> = {
    fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    },
};

export default handler;

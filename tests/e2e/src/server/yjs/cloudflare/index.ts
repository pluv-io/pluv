import { Hono } from "hono";
import { cors } from "hono/cors";
import { ioServer } from "./pluv-io/sqlite";

export { RoomSQLiteDurableObject } from "./durable-objects";
export type { ioServer } from "./pluv-io/sqlite";

const app = new Hono<{ Bindings: CloudflareEnv }>()
    .use(cors({ origin: "*" }))
    .get("/api/pluv/room/:roomId", async (c) => {
        const { roomId } = c.req.param();
        const request = c.req.raw;

        if (!roomId) return c.text("Not found", 404);

        const durableObjectId = c.env.rooms_sqlite.idFromName(roomId);
        const room = c.env.rooms_sqlite.get(durableObjectId);

        return await room.fetch(request);
    })
    .get("/api/pluv/authorize", async (c) => {
        const roomId = c.req.query("room");
        const request = c.req.raw;

        if (!roomId) return c.text("Not found", 404);

        const durableObjectId = c.env.rooms_sqlite.idFromName(roomId);

        const userId = c.req.query("user_id") ?? crypto.randomUUID();
        const user = { id: userId, name: `name:${userId}` };

        const token = await ioServer.createToken({
            env: c.env,
            room: durableObjectId.toString(),
            user,
            request,
        });

        return c.text(token, 200);
    });

const handler: ExportedHandler<CloudflareEnv> = {
    fetch(request, env, ctx) {
        return app.fetch(request, env, ctx);
    },
};

export default handler;

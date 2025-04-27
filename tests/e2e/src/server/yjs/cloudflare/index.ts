import { Hono } from "hono";
import { cors } from "hono/cors";
import { ioServer as ioServerKV } from "./pluv-io/kv";
import { ioServer as ioServerSqlite } from "./pluv-io/sqlite";

export { RoomKVDurableObject, RoomSQLiteDurableObject } from "./durable-objects";
export type { ioServer as ioServerKV } from "./pluv-io/kv";
export type { ioServer as ioServerSqlite } from "./pluv-io/sqlite";

const app = new Hono<{ Bindings: CloudflareEnv }>()
    .use(cors({ origin: "*" }))
    .get("/api/pluv/room/:roomId", async (c) => {
        const { roomId } = c.req.param();
        const request = c.req.raw;

        if (!roomId) return c.text("Not found", 404);

        const namespace = roomId.startsWith("kv") ? c.env.rooms_kv : c.env.rooms_sqlite;
        const durableObjectId = namespace.idFromName(roomId);
        const room = namespace.get(durableObjectId);

        return await room.fetch(request);
    })
    .get("/api/pluv/authorize", async (c) => {
        const roomId = c.req.query("room");
        const request = c.req.raw;

        if (!roomId) return c.text("Not found", 404);

        const namespace = roomId.startsWith("kv") ? c.env.rooms_kv : c.env.rooms_sqlite;
        const durableObjectId = namespace.idFromName(roomId);

        const ioServer = roomId.startsWith("kv") ? ioServerKV : ioServerSqlite;

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

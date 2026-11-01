import { Hono } from "hono";
import { cors } from "hono/cors";
import type { WorkerLoader } from "@pluv/platform/load-user-facet";
import { COMPATIBILITY_DATE, createRoomSupervisor } from "pluv/supervisor";
import { ioServer } from "./user-server";
import facetSource from "./generated/facet.bundle.txt";
import userServerSource from "./generated/server.bundle.txt";

export interface PlatformEnv {
    E2E_TEST_DATABASE_URL?: string;
    LOADER: WorkerLoader;
    rooms: DurableObjectNamespace;
}

const PlatformRoom = createRoomSupervisor<PlatformEnv>({
    version: "platform-e2e",
    code: (env) => {
        const databaseUrl = env.E2E_TEST_DATABASE_URL;

        return {
            compatibilityDate: COMPATIBILITY_DATE,
            // The uploaded module stays off the network unless it has a database to reach.
            ...(databaseUrl
                ? { env: { E2E_TEST_DATABASE_URL: databaseUrl } }
                : { globalOutbound: null }),
            mainModule: "facet.js",
            modules: {
                "facet.js": facetSource,
                "server.js": userServerSource,
            },
        };
    },
});

export class RoomSupervisor extends PlatformRoom {}

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

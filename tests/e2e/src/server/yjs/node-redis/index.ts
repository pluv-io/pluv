import { serve, type HttpBindings } from "@hono/node-server";
import { Option, program } from "commander";
import Crypto, { randomBytes } from "crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Http from "node:http";
import Url from "node:url";
import { match } from "path-to-regexp";
import { WebSocketServer } from "ws";
import { cluster } from "./cluster";
import { io1st, ioServer1st, ioServer2nd } from "./pluv-io";

export type { ioServer1st as ioServer } from "./pluv-io";

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .addOption(
        new Option("--port <PORT>").default(3103).argParser((value: string) => parseInt(value, 10)),
    )
    .argument("[args...]")
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) {
    throw new Error("Port is not a number");
}

const app = new Hono<{ Bindings: HttpBindings }>()
    .use(cors({ origin: "*" }))
    .get("/ok", (c) => {
        return c.text("ok", 200);
    })
    .get("/api/authorize", async (c) => {
        const roomId = c.req.query("roomName") as string;

        if (!roomId) {
            return c.json({ error: `Room does not exist: ${roomId}` }, 404);
        }

        const id = Crypto.randomUUID();
        const token = await io1st.createToken({
            req: c.env.incoming,
            room: roomId,
            user: { id, name: `user:${id}` },
        });

        return c.text(token, 200);
    })
    .post("/api/room", (c) => {
        return c.text(randomBytes(48).toString("hex"), 200);
    });

try {
    cluster.disconnect();
} catch {
    console.log("Cluster did not disconnect");
}

console.log("Connecting to cluster");
cluster.on("connect", () => {
    console.log("Cluster connected");
});

await cluster.connect();

const server = serve(
    {
        fetch: app.fetch,
        port,
    },
    () => {
        console.log(`Server is listening on port: ${port}`);
    },
) as Http.Server;
const wsServer = new WebSocketServer({ server });

const rooms1 = new Map<string, ReturnType<typeof ioServer1st.createRoom>>();
const rooms2 = new Map<string, ReturnType<typeof ioServer2nd.createRoom>>();

const getRoom1 = (roomId: string): ReturnType<typeof ioServer1st.createRoom> => {
    Array.from(rooms1.values()).forEach((room) => {
        if (!room.getSize()) rooms1.delete(room.id);
    });

    const existing = rooms1.get(roomId);

    if (existing) return existing;

    const newRoom = ioServer1st.createRoom(roomId, {
        onRoomDestroyed: (event) => {
            rooms1.delete(event.room);
        },
    });

    rooms1.set(roomId, newRoom);

    return newRoom;
};

const getRoom2 = (roomId: string): ReturnType<typeof ioServer2nd.createRoom> => {
    Array.from(rooms2.values()).forEach((room) => {
        if (!room.getSize()) rooms2.delete(room.id);
    });

    const existing = rooms2.get(roomId);

    if (existing) return existing;

    const newRoom = ioServer2nd.createRoom(roomId, {
        onRoomDestroyed: (event) => {
            rooms2.delete(event.room);
        },
    });

    rooms2.set(roomId, newRoom);

    return newRoom;
};

wsServer.on("connection", async (ws, req) => {
    const url = req.url;

    if (!url) return ws.close(1003, "Invalid WebSocket endpoint");

    const parsed = Url.parse(url, true);
    const matcher = match<{ rest: string[] }>("/api/room/*rest");
    const matched = matcher(parsed.pathname!);

    if (!matched) return ws.close(1003, "Invalid WebSocket endpoint");

    const { rest } = matched.params;
    const [roomId] = rest;

    if (!roomId) return ws.close(1003, "Invalid room name");

    const token = parsed.query?.token as string | undefined;
    const io = parsed.query?.io as string | undefined;
    const room = !io ? getRoom1(roomId) : getRoom2(roomId);

    await room.register(ws, { req, token });
});

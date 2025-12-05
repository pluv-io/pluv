import type { HttpBindings } from "@hono/node-server";
import { serve } from "@hono/node-server";
import type { InferIORoom } from "@pluv/io";
import { Option, program } from "commander";
import Crypto from "crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import Http from "node:http";
import Url from "node:url";
import { match } from "path-to-regexp";
import { WebSocketServer } from "ws";
import { ioServer } from "./pluv-io";

export type { ioServer } from "./pluv-io";

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .addOption(
        new Option("--port <PORT>").default(3112).argParser((value: string) => parseInt(value, 10)),
    )
    .argument("[args...]")
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) throw new Error("Port is not a number");

const app = new Hono<{ Bindings: HttpBindings }>()
    .use(cors({ origin: "*" }))
    .get("/api/pluv/authorize", async (c) => {
        const room = c.req.query("room") as string;

        const id = Crypto.randomUUID();
        const user = { id, name: `user:${id}` };
        const req = c.env.incoming;

        const token = await ioServer.createToken({ user, req, room });

        return c.text(token, 200);
    });
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

const rooms = new Map<string, InferIORoom<typeof ioServer>>();

const getRoom = (roomId: string): InferIORoom<typeof ioServer> => {
    const existing = rooms.get(roomId);
    if (existing) return existing;

    const newRoom = ioServer.createRoom(roomId, {
        onRoomDestroyed: (event) => {
            rooms.delete(event.room);
        },
    });
    rooms.set(roomId, newRoom);

    return newRoom;
};

wsServer.on("connection", async (ws, req) => {
    const url: string = req.url!;
    const parsed = Url.parse(url, true);
    const pathname = parsed.pathname!;

    const matcher = match<{ roomId: string }>("/api/pluv/room/:roomId");
    const matched = matcher(pathname);

    if (!matched) throw new Error("Unexpected unmatch");

    const { roomId } = matched.params;
    const token = parsed.query?.token as string | undefined;

    const room = getRoom(roomId);

    await room.register(ws, { req, token });
});

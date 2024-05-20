import bodyParser from "body-parser";
import { Option, program } from "commander";
import cors from "cors";
import Crypto, { randomBytes } from "crypto";
import express from "express";
import Http from "http";
import { match } from "path-to-regexp";
import Url from "url";
import WebSocket from "ws";
import { cluster } from "./cluster";
import { io1st, ioServer1st, ioServer2nd } from "./pluv-io";

export type { ioServer1st as ioServer } from "./pluv-io";

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .addOption(new Option("--port <PORT>").default(3103).argParser((value: string) => parseInt(value, 10)))
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) {
    throw new Error("Port is not a number");
}

const app = express();
const server = Http.createServer(app);
const wsServer = new WebSocket.Server({ server });

wsServer.on("connection", async (ws, req) => {
    const url = req.url;

    if (!url) return ws.close(1011, "Invalid WebSocket endpoint");

    const parsed = Url.parse(url, true);
    const matcher = match<{ rest: string[] }>("/api/room/:rest+");
    const matched = matcher(parsed.pathname!);

    if (!matched) return ws.close(1011, "Invalid WebSocket endpoint");

    const { rest } = matched.params;
    const [roomId] = rest;

    if (!roomId) return ws.close(1011, "Invalid room name");

    const token = parsed.query?.token as string | undefined;
    const io = parsed.query?.io as string | undefined;
    const room = !io ? ioServer1st.getRoom(roomId, { req }) : ioServer2nd.getRoom(roomId, { req });

    await room.register(ws, { req, token });
});

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

app.get("/ok", (req, res) => {
    res.send("ok").status(200);
});

app.get("/api/authorize", async (req, res) => {
    const roomId = req.query.roomName as string;

    if (!roomId) {
        return res.json({ error: `Room does not exist: ${roomId}` }).status(404);
    }

    const id = Crypto.randomUUID();
    const token = await io1st.createToken({
        req,
        room: roomId,
        user: { id, name: `user:${id}` },
    });

    return res.send(token).status(200);
});

app.post("/api/room", (req, res) => {
    return res.send(randomBytes(48).toString("hex")).status(200);
});

cluster.once("connect", () => {
    server.listen(port, () => {
        console.log(`Server is listening on port: ${port}`);
    });
});

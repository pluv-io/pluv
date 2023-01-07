import bodyParser from "body-parser";
import { program } from "commander";
import cors from "cors";
import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import morgan from "morgan";
import { nanoid } from "nanoid";
import { match } from "path-to-regexp";
import Url from "url";
import WebSocket from "ws";
import { io } from "./pluv-io";

export { io } from "./pluv-io";

const NEW_ROOM_ID_SIZE = 21;

type CommanderOptionValue = string | boolean | string[] | undefined;

const options = program
    .description("Pluv server running on node")
    .option("--port", "Port to run the server on", "8788")
    .parse(process.argv)
    .opts<{ port: CommanderOptionValue }>();

const port = parseInt(`${options.port}`, 10);

if (Number.isNaN(port)) {
    throw new Error("Port is not a number");
}

const app = express();
const server = http.createServer(app);
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
    const room = io.getRoom(roomId);

    await room.register(ws, { token });
});

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
app.use(morgan("combined"));

app.get("/api/authorize", async (req, res) => {
    const roomId = req.query.roomName as string;

    if (!roomId) {
        return res
            .json({ error: `Room does not exist: ${roomId}` })
            .status(404);
    }

    const id = randomUUID();
    const token = await io.createToken({
        room: roomId,
        user: { id, name: `user:${id}` },
    });

    return res.send(token).status(200);
});

app.post("/api/room", (req, res) => {
    const roomId = nanoid(NEW_ROOM_ID_SIZE);

    return res.send(roomId).status(200);
});

server.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});

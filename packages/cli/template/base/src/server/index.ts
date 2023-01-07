import cors from "cors";
import Crypto from "crypto";
import express from "express";
import Http from "http";
import { match } from "path-to-regexp";
import Url from "url";
import { WebSocket } from "ws";
import { io } from "./pluv-io";

export { type io } from "./pluv-io";

const PORT = 3001;

const app = express();
const server = Http.createServer(app);
const wsServer = new WebSocket.Server({ server });

wsServer.on("connection", async (ws, req) => {
    const url = req.url;

    if (!url) return ws.close(1011, "Invalid WebSocket endpoint");

    const parsed = Url.parse(url, true);

    if (!parsed.pathname) return ws.close(1011, "Invalid WebSocket endpoint");

    const matcher = match<{ roomId: string }>("/api/room/:roomId");
    const matched = matcher(parsed.pathname);

    if (!matched) return ws.close(1011, "Invalid WebSocket endpoint");

    const { roomId } = matched.params;

    if (!roomId) return ws.close(1011, "Invalid room name");

    const token = parsed.query?.token as string | undefined;
    const room = io.getRoom(roomId);

    await room.register(ws, { token });
});

app.use(cors({ origin: "*" }));

// Stub authorization route to demonstrate how to setup an authorization endpoint
// for a room. Replace token details depending on your auth requirements.
app.get("/api/authorize", async (req, res) => {
    const roomId = req.query?.room as string | undefined;

    if (!roomId) {
        return res.json({ error: `Room was not provided` }).status(404);
    }

    const id = Crypto.randomUUID();
    const token = await io.createToken({
        room: roomId,
        user: { id, name: `user:${id}` }
    });

    return res.send(token).status(200);
});

server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
});

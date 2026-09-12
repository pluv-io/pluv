import { createIO } from "@pluv/io";
import { describe, expect, it } from "vitest";
import { TestPlatform, TestSocket, tick } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = [...socket.messages].reverse().find((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const send = async (room: Room, socket: TestSocket, type: string, data: unknown): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({ type, data }),
    });
};

describe("IORoom broadcast fan-out", () => {
    it("still delivers to healthy sockets when another send throws", async () => {
        const io = createIO({
            platform: () => new TestPlatform({ mode: "detached" }),
        });
        const server = io.server();
        const room = server.createRoom("fanout");
        const healthy = new TestSocket("session-healthy");
        const broken = new TestSocket("session-broken");

        await room.register(healthy);
        await room.register(broken);
        await send(room, healthy, "$initializeSession", { presence: {}, update: null });
        await send(room, broken, "$initializeSession", { presence: {}, update: null });

        broken.throwOnSend = new Error("socket send failed");

        // Broken socket throws on every outbound message after this point.
        await expect(
            send(room, healthy, "$updatePresence", { presence: { cursor: 1 } }),
        ).resolves.toBeUndefined();

        // Pub/sub delivery is async relative to the originating handler in some paths;
        // drain microtasks so the fan-out has settled.
        await tick(2);

        expect(lastMessage(healthy, "$presenceUpdated").data.presence).toEqual({ cursor: 1 });
        expect(broken.sent.some((raw) => JSON.parse(raw).type === "$presenceUpdated")).toBe(false);
    });
});

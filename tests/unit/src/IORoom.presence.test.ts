import { createIO } from "@pluv/io";
import { describe, expect, it } from "vitest";
import { TestPlatform, TestSocket } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = [...socket.messages].reverse().find((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const initializeSession = async (
    room: Room,
    socket: TestSocket,
    presence: Record<string, unknown>,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$initializeSession",
            data: { presence, update: null },
        }),
    });
};

const updatePresence = async (
    room: Room,
    socket: TestSocket,
    presence: Record<string, unknown>,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$updatePresence",
            data: { presence },
        }),
    });
};

const getOthers = async (room: Room, socket: TestSocket): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$getOthers",
            data: {},
        }),
    });
};

describe("IORoom presence", () => {
    const createRoom = (roomId: string = "presence") => {
        const io = createIO({
            platform: () => new TestPlatform({ mode: "detached" }),
        });
        const server = io.server();
        const room = server.createRoom(roomId);

        return room;
    };

    it("persists initialize presence for later $getOthers and partial patches", async () => {
        const room = createRoom();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await room.register(first);
        await initializeSession(room, first, { cursor: 1, name: "ada" });

        await room.register(second);
        await initializeSession(room, second, { cursor: 0, name: "bob" });
        await getOthers(room, second);

        expect(lastMessage(second, "$othersReceived").data.others["session-1"].presence).toEqual({
            cursor: 1,
            name: "ada",
        });

        await updatePresence(room, first, { cursor: 2 });

        expect(lastMessage(second, "$presenceUpdated").data.presence).toEqual({
            cursor: 2,
            name: "ada",
        });

        await getOthers(room, second);

        expect(lastMessage(second, "$othersReceived").data.others["session-1"].presence).toEqual({
            cursor: 2,
            name: "ada",
        });
    });

    it("still broadcasts $userJoined with the initialize presence payload", async () => {
        const room = createRoom("presence-join");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await room.register(first);
        await initializeSession(room, first, { cursor: 0, name: "ada" });

        await room.register(second);
        await initializeSession(room, second, { cursor: 9, name: "bob" });

        expect(lastMessage(first, "$userJoined").data).toMatchObject({
            connectionId: "session-2",
            presence: { cursor: 9, name: "bob" },
        });
        expect(typeof lastMessage(first, "$userJoined").data.timers.presence).toBe("number");
    });
});

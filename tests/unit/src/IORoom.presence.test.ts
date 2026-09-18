import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

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
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server();
        const room = server.createRoom(roomId);

        return { io, room };
    };

    it("persists initialize presence for later $getOthers and partial patches", async () => {
        const { io, room } = createRoom();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { cursor: 1, name: "ada" });

        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { cursor: 0, name: "bob" });
        await getOthers(room, second);

        const initialOthers = lastMessage(second, "$othersReceived").data.others as {
            connectionIds: string[];
            data: { id: string };
            presence: Record<string, unknown>;
        }[];

        expect(initialOthers).toEqual([
            {
                connectionIds: ["session-1"],
                data: { id: "session-1" },
                presence: { cursor: 1, name: "ada" },
                seq: { presence: expect.any(Number) },
            },
        ]);

        await updatePresence(room, first, { cursor: 2 });

        expect(lastMessage(second, "$presenceUpdated").data.presence).toEqual({
            cursor: 2,
            name: "ada",
        });
        expect(lastMessage(second, "$presenceUpdated").data.user).toEqual({ id: "session-1" });
        expect(lastMessage(second, "$presenceUpdated").user).toEqual({ id: "session-1" });

        await getOthers(room, second);

        expect(lastMessage(second, "$othersReceived").data.others).toEqual([
            {
                connectionIds: ["session-1"],
                data: { id: "session-1" },
                presence: { cursor: 2, name: "ada" },
                seq: { presence: expect.any(Number) },
            },
        ]);
    });

    it("still broadcasts $userJoined with the initialize presence payload", async () => {
        const { io, room } = createRoom("presence-join");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { cursor: 0, name: "ada" });

        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { cursor: 9, name: "bob" });

        expect(lastMessage(first, "$userJoined").data).toMatchObject({
            connectionId: "session-2",
            presence: { cursor: 9, name: "bob" },
        });
        expect(typeof lastMessage(first, "$userJoined").data.seq.presence).toBe("number");
    });

    it("stamps a newer seq on the first $presenceUpdated after initialize", async () => {
        const { io, room } = createRoom("presence-first-write");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { cursor: 0, name: "ada" });

        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { cursor: 9, name: "bob" });

        const joinSeq = lastMessage(first, "$userJoined").data.seq.presence as number;

        await updatePresence(room, second, { cursor: 1 });

        const updated = lastMessage(first, "$presenceUpdated");

        expect(updated.data.presence).toEqual({ cursor: 1, name: "bob" });
        expect(updated.data.seq.presence).toBeGreaterThan(joinSeq);
    });
});

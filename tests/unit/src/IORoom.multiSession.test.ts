import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

type Room = {
    evict: (sessionId: string) => Promise<void>;
    getSize: () => number;
    onClose: (socket: TestSocket) => (event: { code: number; reason: string }) => Promise<void>;
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const ADA = { id: "ada" };
const BOB = { id: "bob" };

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

describe("IORoom multi-session presence", () => {
    const createRoom = (roomId: string) => {
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server();
        const room = server.createRoom(roomId);

        return { io, room };
    };

    it("fans presence updates out to every session of the same user", async () => {
        const { io, room } = createRoom("presence-fanout");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const observer = new TestSocket("session-3");

        await registerAuthorized(room, first, { io, user: ADA });
        await initializeSession(room, first, { cursor: 1, name: "ada" });

        await registerAuthorized(room, second, { io, user: ADA });
        await initializeSession(room, second, { cursor: 1, name: "ada" });

        await registerAuthorized(room, observer, { io, user: BOB });
        await initializeSession(room, observer, { name: "bob" });

        await updatePresence(room, first, { cursor: 2 });
        await getOthers(room, observer);

        const others = lastMessage(observer, "$othersReceived").data.others;

        expect(others).toEqual([
            {
                connectionIds: ["session-1", "session-2"],
                data: { id: "ada" },
                presence: { cursor: 2, name: "ada" },
                timers: { presence: expect.any(Number) },
            },
        ]);
        expect(lastMessage(observer, "$othersReceived").data.myConnectionIds).toEqual([
            "session-3",
        ]);

        await getOthers(room, second);

        expect(lastMessage(second, "$othersReceived").data).toEqual({
            myConnectionIds: ["session-1", "session-2"],
            others: [
                {
                    connectionIds: ["session-3"],
                    data: { id: "bob" },
                    presence: { name: "bob" },
                    timers: { presence: expect.any(Number) },
                },
            ],
        });
    });

    it("keeps the user present after one of their sessions disconnects", async () => {
        const { io, room } = createRoom("presence-partial-disconnect");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const observer = new TestSocket("session-3");

        await registerAuthorized(room, first, { io, user: ADA });
        await initializeSession(room, first, { cursor: 1, name: "ada" });

        await registerAuthorized(room, second, { io, user: ADA });
        await initializeSession(room, second, { cursor: 1, name: "ada" });

        await registerAuthorized(room, observer, { io, user: BOB });
        await initializeSession(room, observer, { name: "bob" });

        await updatePresence(room, first, { cursor: 2 });

        expect(room.getSize()).toBe(3);

        await room.onClose(first)({ code: 1000, reason: "" });
        await getOthers(room, observer);

        const others = lastMessage(observer, "$othersReceived").data.others;

        expect(room.getSize()).toBe(2);
        expect(others).toEqual([
            {
                connectionIds: ["session-2"],
                data: { id: "ada" },
                presence: { cursor: 2, name: "ada" },
                timers: { presence: expect.any(Number) },
            },
        ]);
        expect(lastMessage(observer, "$exit").data.sessionId).toBe("session-1");
        expect(lastMessage(observer, "$exit").data.user).toEqual({ id: "ada" });
        expect(lastMessage(observer, "$exit").user).toEqual({ id: "ada" });
    });

    it("seeds a later session with the user's latest presence", async () => {
        const { io, room } = createRoom("presence-late-join");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io, user: ADA });
        await initializeSession(room, first, { cursor: 1, name: "ada" });

        await registerAuthorized(room, second, { io, user: ADA });

        const registered = lastMessage(second, "$registered");

        expect(registered.data.presence).toEqual({ cursor: 1, name: "ada" });
        expect(typeof registered.data.timers.presence).toBe("number");
        expect(registered.data.connectionCount).toBe(2);
        expect(registered.data.userCount).toBe(1);
    });

    it("keeps the last presence write when a later tab initializes with a stale seed", async () => {
        const { io, room } = createRoom("presence-lww-initialize");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const observer = new TestSocket("session-3");

        await registerAuthorized(room, first, { io, user: ADA });
        await initializeSession(room, first, { cursor: 1, name: "ada" });
        await updatePresence(room, first, { cursor: 2 });

        await registerAuthorized(room, observer, { io, user: BOB });
        await initializeSession(room, observer, { name: "bob" });

        await registerAuthorized(room, second, { io, user: ADA });
        await initializeSession(room, second, { cursor: 1, name: "stale" });
        await getOthers(room, observer);

        expect(lastMessage(second, "$registered").data.presence).toEqual({
            cursor: 2,
            name: "ada",
        });
        expect(lastMessage(observer, "$userJoined").data.presence).toEqual({
            cursor: 2,
            name: "ada",
        });
        expect(lastMessage(observer, "$othersReceived").data.others).toEqual([
            {
                connectionIds: ["session-1", "session-2"],
                data: { id: "ada" },
                presence: { cursor: 2, name: "ada" },
                timers: { presence: expect.any(Number) },
            },
        ]);

        await updatePresence(room, second, { cursor: 3 });
        await getOthers(room, observer);

        expect(lastMessage(observer, "$othersReceived").data.others).toEqual([
            {
                connectionIds: ["session-1", "session-2"],
                data: { id: "ada" },
                presence: { cursor: 3, name: "ada" },
                timers: { presence: expect.any(Number) },
            },
        ]);
    });
});

import { describe, expect, it } from "vitest";
import {
    createAuthorizedIO,
    encodedStateWithContent,
    registerAuthorized,
    TestSocket,
    testYjsTreaty,
} from "./__utils__";

type Room = {
    evict: (sessionId: string) => Promise<void>;
    getSize: () => number;
    onClose: (socket: TestSocket) => (event: { code: number; reason: string }) => Promise<void>;
    onError: (socket: TestSocket) => (event: { error: unknown }) => Promise<void>;
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const getOthers = async (room: Room, socket: TestSocket): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$getOthers",
            data: {},
        }),
    });
};

describe("IORoom close", () => {
    it("runs disconnect once when a socket errors then closes", async () => {
        const disconnected: string[] = [];
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server({
            onUserDisconnected: ({ user }) => {
                disconnected.push(user?.id ?? "missing");
            },
        });
        const room = server.createRoom("error-then-close");
        const first = new TestSocket("session-1");
        const observer = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, observer, { io });

        await room.onError(first)({ error: new Error("socket failed") });
        await room.onClose(first)({ code: 1011, reason: "socket failed" });
        await getOthers(room, observer);

        expect(disconnected).toEqual(["session-1"]);
        expect(observer.messages.filter((message) => message.type === "$exit")).toHaveLength(1);
        expect(lastMessage(observer, "$exit").data.sessionId).toBe("session-1");
        expect(lastMessage(observer, "$exit").data.user).toEqual({ id: "session-1" });
        expect(lastMessage(observer, "$exit").user).toEqual({ id: "session-1" });
        expect(room.getSize()).toBe(1);
        expect(lastMessage(observer, "$othersReceived").data.others).toEqual([]);
    });

    it("does not tear down storage when one of two sockets leaves", async () => {
        const roomDestroyed: string[] = [];
        const storageDestroyed: string[] = [];
        const io = createAuthorizedIO({
            treaty: testYjsTreaty,
            platform: { mode: "detached" },
        });
        const server = io.server({
            getInitialStorage: () => encodedStateWithContent("keep me"),
            onRoomDestroyed: ({ room }) => {
                roomDestroyed.push(room);
            },
            onStorageDestroyed: ({ room }) => {
                storageDestroyed.push(room);
            },
        });
        const room = server.createRoom("partial-teardown");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });

        expect(room.getSize()).toBe(2);

        await room.onClose(first)({ code: 1000, reason: "" });
        await getOthers(room, second);

        expect(room.getSize()).toBe(1);
        expect(roomDestroyed).toEqual([]);
        expect(storageDestroyed).toEqual([]);
        expect(lastMessage(second, "$exit").data.sessionId).toBe("session-1");
        expect(lastMessage(second, "$exit").data.user).toEqual({ id: "session-1" });
        expect(lastMessage(second, "$exit").user).toEqual({ id: "session-1" });
        expect(lastMessage(second, "$othersReceived").data.others).toEqual([]);
    });

    it("evicts one session without destroying the room", async () => {
        const roomDestroyed: string[] = [];
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const server = io.server({
            onRoomDestroyed: ({ room }) => {
                roomDestroyed.push(room);
            },
        });
        const room = server.createRoom("evict-one");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });

        expect(room.getSize()).toBe(2);

        await room.evict("session-1");
        await getOthers(room, second);

        expect(room.getSize()).toBe(1);
        expect(roomDestroyed).toEqual([]);
        expect(lastMessage(second, "$exit").data.sessionId).toBe("session-1");
        expect(lastMessage(second, "$exit").data.user).toEqual({ id: "session-1" });
        expect(lastMessage(second, "$exit").user).toEqual({ id: "session-1" });
        expect(lastMessage(second, "$othersReceived").data.others).toEqual([]);
    });
});

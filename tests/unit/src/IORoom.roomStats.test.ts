import { __internal } from "@pluv/io";
import { describe, expect, it, vi } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket, waitUntil } from "./__utils__";

type Room = {
    onClose: (socket: TestSocket) => (event: { code: number; reason: string }) => Promise<void>;
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const initializeSession = async (room: Room, socket: TestSocket): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$initializeSession",
            data: { presence: {}, update: null },
        }),
    });
};

const waitForRoomStats = async (socket: TestSocket, predicate: (data: any) => boolean) => {
    await waitUntil(() => {
        const message = socket.messages.findLast((entry) => entry.type === "$roomStats");

        return !!message && predicate(message.data);
    });
};

describe("IORoom $roomStats", () => {
    const createRoom = (roomId: string) => {
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const room = io.server().createRoom(roomId);

        return { io, room };
    };

    it("emits server-origin stats with a null sender", async () => {
        const { io, room } = createRoom("stats-sender");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io, user: { id: "ada" } });
        await waitForRoomStats(socket, (data) => data.connectionCount === 1);

        const message = lastMessage(socket, "$roomStats");

        expect(message.connectionId).toBeNull();
        expect(message.user).toBeNull();
        expect(message.data).toEqual({ connectionCount: 1, userCount: 1 });
        expect(lastMessage(socket, "$registered").data).toMatchObject({
            connectionCount: 1,
            userCount: 1,
        });
    });

    it("throttles a burst of joins: emit immediately, then once more with the latest counts", async () => {
        vi.useFakeTimers();

        try {
            const { io, room } = createRoom("stats-throttle");
            const first = new TestSocket("session-1");
            const second = new TestSocket("session-2");
            const third = new TestSocket("session-3");

            await registerAuthorized(room, first, { io, user: { id: "ada" } });
            await vi.advanceTimersByTimeAsync(0);

            const leading = first.messages.filter((message) => message.type === "$roomStats");

            expect(leading).toHaveLength(1);
            expect(leading[0]?.data).toEqual({ connectionCount: 1, userCount: 1 });

            await registerAuthorized(room, second, { io, user: { id: "bob" } });
            await registerAuthorized(room, third, { io, user: { id: "cara" } });

            expect(first.messages.filter((message) => message.type === "$roomStats")).toHaveLength(
                1,
            );

            await vi.advanceTimersByTimeAsync(__internal.ROOM_STATS_THROTTLE_MS);

            const emits = first.messages.filter((message) => message.type === "$roomStats");

            expect(emits).toHaveLength(2);
            expect(emits[1]?.data).toEqual({ connectionCount: 3, userCount: 3 });
        } finally {
            vi.useRealTimers();
        }
    });

    it("counts unique users across tabs", async () => {
        const { io, room } = createRoom("stats-users");
        const ada1 = new TestSocket("session-1");
        const ada2 = new TestSocket("session-2");
        const bob = new TestSocket("session-3");

        await registerAuthorized(room, ada1, { io, user: { id: "ada" } });
        await initializeSession(room, ada1);
        await registerAuthorized(room, ada2, { io, user: { id: "ada" } });
        await initializeSession(room, ada2);
        await registerAuthorized(room, bob, { io, user: { id: "bob" } });
        await initializeSession(room, bob);
        await waitForRoomStats(bob, (data) => data.connectionCount === 3 && data.userCount === 2);

        expect(lastMessage(bob, "$roomStats").data).toEqual({
            connectionCount: 3,
            userCount: 2,
        });

        await room.onClose(ada1)({ code: 1000, reason: "" });
        await waitForRoomStats(bob, (data) => data.connectionCount === 2 && data.userCount === 2);

        expect(lastMessage(bob, "$roomStats").data).toEqual({
            connectionCount: 2,
            userCount: 2,
        });
    });
});

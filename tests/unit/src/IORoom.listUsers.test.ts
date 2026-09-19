import { describe, expect, it } from "vitest";
import { createAuthorizedIO, registerAuthorized, TestSocket } from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const sendListUsers = async (
    room: Room,
    socket: TestSocket,
    params: { cursor?: string | null; limit?: number; requestId?: string } = {},
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$listUsers",
            data: params,
        }),
    });
};

const listUsers = async (
    room: Room,
    socket: TestSocket,
    params: { cursor?: string | null; limit?: number } = {},
): Promise<any> => {
    await sendListUsers(room, socket, params);

    return lastMessage(socket, "$usersPage").data;
};

describe("IORoom listUsers", () => {
    const createRoom = (roomId: string) => {
        const io = createAuthorizedIO({
            platform: { mode: "detached" },
        });
        const room = io.server().createRoom(roomId);

        return { io, room };
    };

    it("pages live users by data.id without overlap, presence, or connectionIds", async () => {
        const { io, room } = createRoom("list-users");
        const requester = new TestSocket("session-req");
        const sockets = ["ada", "bob", "cara", "drew"].map((id) => new TestSocket(`session-${id}`));

        await registerAuthorized(room, requester, { io, user: { id: "zzz-requester" } });
        await Promise.all(
            sockets.map((socket) => {
                const id = socket.id.replace("session-", "");

                return registerAuthorized(room, socket, { io, user: { id } });
            }),
        );

        const first = await listUsers(room, requester, { limit: 2 });

        expect(first.users).toEqual([{ data: { id: "ada" } }, { data: { id: "bob" } }]);
        expect(first.pageInfo).toEqual({ endCursor: "bob", hasNextPage: true });
        expect(first.users[0]).not.toHaveProperty("presence");
        expect(first.users[0]).not.toHaveProperty("connectionIds");

        const second = await listUsers(room, requester, {
            cursor: first.pageInfo.endCursor,
            limit: 2,
        });

        expect(second.users.map((row: { data: { id: string } }) => row.data.id)).toEqual([
            "cara",
            "drew",
        ]);
        expect(second.pageInfo.hasNextPage).toBe(true);

        const last = await listUsers(room, requester, {
            cursor: second.pageInfo.endCursor,
            limit: 2,
        });

        expect(last.users).toEqual([{ data: { id: "zzz-requester" } }]);
        expect(last.pageInfo.hasNextPage).toBe(false);
        expect(last.pageInfo.endCursor).toBe("zzz-requester");
    });

    it("echoes requestId so overlapping pages can be correlated", async () => {
        const { io, room } = createRoom("list-users-request-id");
        const requester = new TestSocket("session-req");

        await registerAuthorized(room, requester, { io, user: { id: "zzz-requester" } });
        await Promise.all(
            ["ada", "bob", "cara"].map((id) => {
                return registerAuthorized(room, new TestSocket(`session-${id}`), {
                    io,
                    user: { id },
                });
            }),
        );

        await sendListUsers(room, requester, { limit: 1, requestId: "page-a" });
        await sendListUsers(room, requester, { limit: 10, requestId: "page-b" });

        const pages = requester.messages
            .filter((message) => message.type === "$usersPage")
            .map((message) => message.data);
        const byId = Object.fromEntries(pages.map((page) => [page.requestId, page]));

        expect(byId["page-a"]?.users).toHaveLength(1);
        expect(byId["page-b"]?.users.length).toBeGreaterThan(1);
        expect(pages.map((page) => page.requestId)).toEqual(
            expect.arrayContaining(["page-a", "page-b"]),
        );
    });

    it("groups multiple sessions of the same user into one row", async () => {
        const { io, room } = createRoom("list-users-group");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const observer = new TestSocket("session-3");

        await registerAuthorized(room, first, { io, user: { id: "ada" } });
        await registerAuthorized(room, second, { io, user: { id: "ada" } });
        await registerAuthorized(room, observer, { io, user: { id: "bob" } });

        const page = await listUsers(room, observer, { limit: 10 });

        expect(page.users).toEqual([{ data: { id: "ada" } }, { data: { id: "bob" } }]);
        expect(page.pageInfo).toEqual({ endCursor: "bob", hasNextPage: false });
    });

    it("rejects a limit outside 1..100 instead of clamping", async () => {
        const { io, room } = createRoom("list-users-limit");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io, user: { id: "ada" } });

        const errorsBefore = socket.messages.filter((message) => message.type === "$error").length;

        await sendListUsers(room, socket, { limit: 0, requestId: "bad-zero" });

        expect(lastMessage(socket, "$usersPage").data).toEqual({
            requestId: "bad-zero",
            success: false,
            error: {
                code: "INVALID_LIMIT",
                message: expect.stringMatching(/Invalid listUsers limit/),
            },
        });
        expect(socket.messages.filter((message) => message.type === "$error")).toHaveLength(
            errorsBefore,
        );

        await sendListUsers(room, socket, { limit: 101, requestId: "bad-high" });

        expect(lastMessage(socket, "$usersPage").data).toMatchObject({
            requestId: "bad-high",
            success: false,
            error: { code: "INVALID_LIMIT" },
        });
        expect(socket.messages.filter((message) => message.type === "$error")).toHaveLength(
            errorsBefore,
        );
    });

    it("returns an empty page when the cursor is past the end", async () => {
        const { io, room } = createRoom("list-users-cursor");
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io, user: { id: "ada" } });

        const page = await listUsers(room, socket, { cursor: "zzz", limit: 10 });

        expect(page.users).toEqual([]);
        expect(page.pageInfo).toEqual({ endCursor: null, hasNextPage: false });
    });

    it("exposes the same page on the server room without the websocket protocol", async () => {
        const { io, room } = createRoom("list-users-server");
        const sockets = ["ada", "bob", "cara"].map((id) => new TestSocket(`session-${id}`));

        await Promise.all(
            sockets.map((socket) => {
                const id = socket.id.replace("session-", "");

                return registerAuthorized(room, socket, { io, user: { id } });
            }),
        );

        const first = room.listUsers({ limit: 2 });

        expect(first).toEqual({
            success: true,
            pageInfo: { endCursor: "bob", hasNextPage: true },
            users: [{ data: { id: "ada" } }, { data: { id: "bob" } }],
        });

        if (!first.success) throw new Error("expected a page");

        const second = room.listUsers({ cursor: first.pageInfo.endCursor, limit: 2 });

        expect(second).toEqual({
            success: true,
            pageInfo: { endCursor: "cara", hasNextPage: false },
            users: [{ data: { id: "cara" } }],
        });

        const invalid = room.listUsers({ limit: 0 });

        expect(invalid.success).toBe(false);
        if (invalid.success) throw new Error("expected INVALID_LIMIT");
        expect(invalid.error.code).toBe("INVALID_LIMIT");
        expect(invalid.error.message).toMatch(/Invalid listUsers limit/);
    });
});

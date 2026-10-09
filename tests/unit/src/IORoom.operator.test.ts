import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { authorize } from "@pluv/io";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    createAuthorizedToken,
    encodedStateWithContent,
    registerAuthorized,
    TEST_AUTH_SECRET,
    TestPlatform,
    TestSocket,
    testAuthorizeUser,
    testOperatorTokenUser,
    testOperatorUser,
    testYjsTreaty,
} from "./__utils__";

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const initializeSession = async (
    room: {
        onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    },
    socket: TestSocket,
    presence: Record<string, unknown> = {},
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$initializeSession",
            data: { presence, update: null },
        }),
    });
};

const getOthers = async (
    room: {
        onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    },
    socket: TestSocket,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({ type: "$getOthers", data: {} }),
    });
};

describe("IORoom operator sessions", () => {
    it("throws when minting an operator token without onGetOperator", async () => {
        const io = createAuthorizedIO();

        await expect(
            io.server().createToken({
                room: "no-hook",
                kind: "operator",
                operator: testOperatorTokenUser,
            }),
        ).rejects.toThrow(/io\.server\(\)/);
    });

    it("throws when the operator email is empty", async () => {
        const io = createAuthorizedIO();
        const server = io.server({
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });

        await expect(
            server.createToken({
                room: "empty-email",
                kind: "operator",
                operator: { ...testOperatorUser, email: "" },
            }),
        ).rejects.toThrow(/Invalid operator email/);
    });

    it("throws when onGetOperator returns null or an invalid treaty user", async () => {
        const io = createAuthorizedIO();
        const denied = io.server({
            onGetOperator: () => null,
        });
        const invalid = io.server({
            onGetOperator: () => ({ name: "missing-id" }) as never,
        });

        await expect(
            denied.createToken({
                room: "denied",
                kind: "operator",
                operator: testOperatorTokenUser,
            }),
        ).rejects.toThrow(/null/);
        await expect(
            invalid.createToken({
                room: "invalid",
                kind: "operator",
                operator: testOperatorTokenUser,
            }),
        ).rejects.toThrow();
    });

    it("seals the treaty user into the operator token", async () => {
        const io = createAuthorizedIO();
        const server = io.server({
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });
        const token = await createAuthorizedToken(server, {
            room: "claims",
            kind: "operator",
        });
        const payload = await authorize({
            platform: new TestPlatform(),
            secret: TEST_AUTH_SECRET,
        }).decode(token);

        expect(payload).toMatchObject({
            kind: "operator",
            operator: testOperatorUser,
            room: "claims",
            user: { id: "owner:staff-1" },
        });
        expect(payload?.operator).not.toHaveProperty("email");
    });

    it("measures the treaty user and operator profile against one size limit", async () => {
        const together = createAuthorizedIO({
            limits: { userMaxSize: 70 },
        }).server({
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });

        await expect(
            together.createToken({
                room: "together",
                kind: "operator",
                operator: testOperatorTokenUser,
            }),
        ).rejects.toThrow(/User and operator together must be at most/);

        const fits = createAuthorizedIO({
            limits: { userMaxSize: 80 },
        }).server({
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });

        await expect(
            fits.createToken({
                room: "email",
                kind: "operator",
                operator: {
                    ...testOperatorTokenUser,
                    email: `${"a".repeat(200)}@pluv.io`,
                },
            }),
        ).resolves.toEqual(expect.any(String));
        await expect(
            fits.createToken({
                room: "card",
                kind: "operator",
                operator: {
                    ...testOperatorTokenUser,
                    imageUrl: "x".repeat(40),
                },
            }),
        ).rejects.toThrow(/User and operator together must be at most/);

        const users = createAuthorizedIO({
            limits: { userMaxSize: 50 },
        });

        await expect(
            users.createToken({
                room: "user-only",
                user: { id: "x".repeat(60) },
            }),
        ).rejects.toThrow(/User must be at most/);
    });

    it("connects an operator token without calling onGetOperator again", async () => {
        const io = createAuthorizedIO();
        const mint = io.server({
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });
        const token = await createAuthorizedToken(mint, {
            room: "leftover",
            kind: "operator",
        });

        const missingRoom = io.server().createRoom("leftover");
        const missingSocket = new TestSocket("session-missing");

        await missingRoom.register(missingSocket, { token });

        expect(missingRoom.getSize()).toBe(1);
        expect(lastMessage(missingSocket, "$registered").user).toEqual({ id: "owner:staff-1" });

        const deniedRoom = io
            .server({
                onGetOperator: () => null,
            })
            .createRoom("leftover-denied");
        const deniedToken = await createAuthorizedToken(mint, {
            room: "leftover-denied",
            kind: "operator",
        });
        const deniedSocket = new TestSocket("session-denied");

        await deniedRoom.register(deniedSocket, { token: deniedToken });

        expect(deniedRoom.getSize()).toBe(1);
        expect(lastMessage(deniedSocket, "$registered").user).toEqual({ id: "owner:staff-1" });
    });

    it("attaches kind, operator, and derived user without collapsing occupant identity", async () => {
        const io = createAuthorizedIO();
        const server = io.server({
            onGetOperator: () => ({ id: "ada" }),
        });
        const room = server.createRoom("operator-join");
        const occupant = new TestSocket("session-ada");
        const operator = new TestSocket("session-staff");
        const observer = new TestSocket("session-bob");

        await registerAuthorized(room, occupant, { io, user: { id: "ada" } });
        await initializeSession(room, occupant, { name: "player" });
        await registerAuthorized(room, operator, { io: server, kind: "operator" });
        await initializeSession(room, operator, { name: "staff" });
        await registerAuthorized(room, observer, { io, user: { id: "bob" } });
        await initializeSession(room, observer, { name: "bob" });
        await getOthers(room, observer);
        await getOthers(room, operator);

        const registered = lastMessage(operator, "$registered");

        const operatorProfile = {
            id: testOperatorUser.id,
            name: testOperatorUser.name,
            imageUrl: testOperatorUser.imageUrl,
        };

        expect(registered.user).toEqual({ id: "ada" });
        expect(registered.operator).toEqual(operatorProfile);
        expect(registered.data.session.kind).toBe("operator");
        expect(registered.data.session.operator).toEqual(operatorProfile);
        expect(registered.data.stats.user).toEqual({ connectionCount: 1, userCount: 1 });
        expect(registered.data.stats.operator).toEqual({ connectionCount: 1, userCount: 1 });
        expect(registered.data.session.presence).not.toEqual({ name: "player" });

        const others = lastMessage(observer, "$othersReceived").data.others;

        expect(others).toEqual(
            expect.arrayContaining([
                {
                    connectionIds: ["session-ada"],
                    data: { id: "ada" },
                    session: {
                        kind: "user",
                        operator: null,
                        presence: { name: "player" },
                        seq: { presence: expect.any(Number) },
                    },
                },
                {
                    connectionIds: ["session-staff"],
                    data: { id: "ada" },
                    session: {
                        kind: "operator",
                        operator: {
                            id: testOperatorUser.id,
                            name: testOperatorUser.name,
                            imageUrl: testOperatorUser.imageUrl,
                        },
                        presence: { name: "staff" },
                        seq: { presence: expect.any(Number) },
                    },
                },
            ]),
        );
        expect(lastMessage(operator, "$othersReceived").data.myConnectionIds).toEqual([
            "session-staff",
        ]);
        expect(room.listUsers({ limit: 10 })).toEqual({
            success: true,
            pageInfo: { endCursor: { kind: "user", id: "bob" }, hasNextPage: false },
            users: [
                { data: { id: "ada" }, kind: "user", operator: null },
                { data: { id: "bob" }, kind: "user", operator: null },
            ],
        });
        expect(lastMessage(observer, "$registered").data.stats).toEqual({
            user: { connectionCount: 2, userCount: 2 },
            operator: { connectionCount: 1, userCount: 1 },
        });
        expect(room.getSize()).toBe(3);
    });

    it("passes kind and operator to message and storage listeners", async () => {
        const operatorProfile = {
            id: testOperatorUser.id,
            name: testOperatorUser.name,
            imageUrl: testOperatorUser.imageUrl,
        };
        const messages: { kind?: string; operator: unknown }[] = [];
        const storageUpdates: {
            kind?: string;
            operator: unknown;
            hasUser: boolean;
            hasWebSocket: boolean;
        }[] = [];
        const io = createAuthorizedIO({
            treaty: testYjsTreaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
            onGetOperator: () => ({ id: "owner:staff-1" }),
            onRoomMessage: (event) => {
                messages.push({
                    kind: event.kind,
                    operator: event.operator,
                });
            },
            onStorageUpdated: (event) => {
                storageUpdates.push({
                    kind: event.kind,
                    operator: event.operator,
                    hasUser: "user" in event,
                    hasWebSocket: "webSocket" in event,
                });
            },
        });
        const room = server.createRoom("operator-listeners");
        const occupant = new TestSocket("session-ada");
        const operator = new TestSocket("session-staff");

        await registerAuthorized(room, occupant, { io, user: { id: "ada" } });
        await room.onMessage(occupant)({
            data: JSON.stringify({ type: "note", data: { text: "player" } }),
        });
        await registerAuthorized(room, operator, { io: server, kind: "operator" });
        await room.onMessage(operator)({
            data: JSON.stringify({
                type: "$initializeSession",
                data: { presence: {}, update: encodedStateWithContent("seed") },
            }),
        });
        await room.onMessage(occupant)({
            data: JSON.stringify({
                type: "$updateStorage",
                data: { origin: null, update: encodedStateWithContent("player edit") },
            }),
        });
        await room.onMessage(operator)({
            data: JSON.stringify({
                type: "$updateStorage",
                data: { origin: null, update: encodedStateWithContent("edit") },
            }),
        });
        await room.onMessage(operator)({
            data: JSON.stringify({ type: "note", data: { text: "staff" } }),
        });

        expect(messages).toEqual([
            { kind: "user", operator: null },
            { kind: "operator", operator: operatorProfile },
            { kind: "user", operator: null },
            { kind: "operator", operator: operatorProfile },
            { kind: "operator", operator: operatorProfile },
        ]);
        expect(storageUpdates).toEqual([
            {
                kind: "operator",
                operator: operatorProfile,
                hasUser: true,
                hasWebSocket: true,
            },
            {
                kind: "user",
                operator: null,
                hasUser: false,
                hasWebSocket: false,
            },
            {
                kind: "operator",
                operator: operatorProfile,
                hasUser: false,
                hasWebSocket: false,
            },
        ]);
    });
});

describe("IORoom operator treaty context", () => {
    const presence = z.object({
        selectionId: z.string().nullable(),
        actor: z.string().nullable(),
    });
    const storage = yjs.schema({
        messages: yjs.yArray(s.string()),
    });
    const t = createTreaty({
        user: testAuthorizeUser,
        presence,
        storage,
    });
    const select = t.procedure.presence
        .input(z.object({ id: z.string().nullable() }))
        .resolve(({ id }, { user, operator }) => ({
            selectionId: id,
            actor: operator ? operator.id : user.id,
        }));
    const treaty = t.router({ select });

    it("passes operator on staff presence procedures and null for occupants", async () => {
        const io = createAuthorizedIO({
            treaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
            onGetOperator: () => ({ id: "owner:staff-1" }),
        });
        const room = server.createRoom("operator-treaty");
        const occupant = new TestSocket("session-ada");
        const operator = new TestSocket("session-staff");

        await registerAuthorized(room, occupant, { io, user: { id: "ada" } });
        await initializeSession(room, occupant, { selectionId: null, actor: null });
        await registerAuthorized(room, operator, { io: server, kind: "operator" });
        await initializeSession(room, operator, { selectionId: null, actor: null });

        await room.__experimental_presence.select({ id: "item" }, occupant.id);
        await room.__experimental_presence.select({ id: "item" }, operator.id);

        expect(lastMessage(operator, "$presenceUpdated").data.session.presence).toEqual({
            selectionId: "item",
            actor: "staff-1",
        });
        expect(lastMessage(occupant, "$presenceUpdated").data.session.operator).toEqual({
            id: testOperatorUser.id,
            name: testOperatorUser.name,
            imageUrl: testOperatorUser.imageUrl,
        });

        const occupantPresence = occupant.messages.findLast(
            (message) =>
                message.type === "$presenceUpdated" &&
                message.data.session.presence.actor === "ada",
        );

        expect(occupantPresence?.data.session.presence).toEqual({
            selectionId: "item",
            actor: "ada",
        });
        expect((occupantPresence as { operator?: unknown } | undefined)?.operator).toBeNull();
    });
});

import { manageSessions } from "@pluv/io";
import { NoopCrdtDoc } from "@pluv/crdt";
import { describe, expect, it, vi } from "vitest";
import {
    createAuthorizedIO,
    encodedStateWithContent,
    registerAuthorized,
    TestPlatform,
    TestSocket,
    testYjsTreaty,
} from "./__utils__";

const messagesOf = (socket: TestSocket, type: string): unknown[] => {
    return socket.messages.filter((entry) => entry.type === type);
};

describe("manageSessions flat path", () => {
    it("does not read the document for a presence update", async () => {
        const spy = vi.spyOn(NoopCrdtDoc.prototype, "getEncodedState");
        const io = createAuthorizedIO({});
        const room = manageSessions(io.server().createRoom("presence-no-doc"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io, user: { id: "ada" } });
        spy.mockClear();

        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$updatePresence",
                data: { presence: { cursor: 1 } },
            }),
        });

        expect(spy).not.toHaveBeenCalled();
        expect(messagesOf(socket, "$presenceUpdated").length).toBeGreaterThan(0);
        spy.mockRestore();
    });

    it("sends $userJoined and $storageReceived together, or neither", async () => {
        const io = createAuthorizedIO({
            limits: { storageMaxSize: 1 },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io.server({ getInitialStorage: () => null }).createRoom("init-both"),
        );
        const ada = new TestSocket("session-ada");
        const bob = new TestSocket("session-bob");

        await registerAuthorized(room, ada, { io, user: { id: "ada" } });
        await registerAuthorized(room, bob, { io, user: { id: "bob" } });

        await room.onMessage(ada)({
            data: JSON.stringify({
                type: "$initializeSession",
                data: {
                    presence: { name: "ada" },
                    update: encodedStateWithContent("too big"),
                },
            }),
        });

        expect(messagesOf(ada, "$userJoined")).toEqual([]);
        expect(messagesOf(ada, "$storageReceived")).toEqual([]);
        expect(messagesOf(bob, "$userJoined")).toEqual([]);
        expect(messagesOf(bob, "$storageReceived")).toEqual([]);

        await room.onMessage(bob)({
            data: JSON.stringify({ type: "$getOthers", data: {} }),
        });

        const others = messagesOf(bob, "$othersReceived")[0] as {
            data: { others: { data: { id: string }; session: { presence: unknown } }[] };
        };

        expect(others.data.others).toEqual([
            expect.objectContaining({
                data: { id: "ada" },
                session: expect.objectContaining({
                    presence: expect.objectContaining({ name: "ada" }),
                }),
            }),
        ]);
    });

    it("broadcasts an unknown event that does not start with $", async () => {
        const io = createAuthorizedIO({});
        const room = manageSessions(io.server().createRoom("unknown-relay"));
        const ada = new TestSocket("session-ada");
        const bob = new TestSocket("session-bob");

        await registerAuthorized(room, ada, { io, user: { id: "ada" } });
        await registerAuthorized(room, bob, { io, user: { id: "bob" } });

        await room.onMessage(ada)({
            data: JSON.stringify({ type: "cursor", data: { x: 1 } }),
        });

        expect(messagesOf(ada, "cursor")).toEqual([
            expect.objectContaining({ data: { x: 1 }, type: "cursor" }),
        ]);
        expect(messagesOf(bob, "cursor")).toEqual([
            expect.objectContaining({ data: { x: 1 }, type: "cursor" }),
        ]);
    });

    it("destroys the room only when the last socket closes", async () => {
        const destroyed: string[] = [];
        const io = createAuthorizedIO({});
        const server = io.server({
            onRoomDestroyed: ({ room }) => {
                destroyed.push(room);
            },
        });
        const room = manageSessions(server.createRoom("last-close"));
        const ada = new TestSocket("session-ada");
        const bob = new TestSocket("session-bob");

        await registerAuthorized(room, ada, { io, user: { id: "ada" } });
        await registerAuthorized(room, bob, { io, user: { id: "bob" } });
        await room.onClose(ada)({ code: 1000, reason: "bye" });

        expect(room.getSize()).toBe(1);
        expect(destroyed).toEqual([]);

        await room.onClose(bob)({ code: 1000, reason: "bye" });

        expect(room.getSize()).toBe(0);
        expect(destroyed).toEqual(["last-close"]);
    });

    it("garbage collection empties a room whose sockets have gone quiet", async () => {
        const destroyed: string[] = [];
        const socket = new TestSocket("session-1");
        const io = createAuthorizedIO({
            platform: () =>
                new TestPlatform({
                    lastPings: new Map([[socket, Date.now() - 60_000]]),
                }),
        });
        const server = io.server({
            onRoomDestroyed: ({ room }) => {
                destroyed.push(room);
            },
        });
        const room = manageSessions(server.createRoom("gc-empty"));

        await registerAuthorized(room, socket, { io, user: { id: "ada" } });
        expect(room.getSize()).toBe(0);

        await room.garbageCollect();

        expect(room.getSize()).toBe(0);
        expect(destroyed).toEqual(["gc-empty"]);
    });

    it("hydrates sockets from manageSessions", async () => {
        const roomId = "hydrate-split";
        const socket = new TestSocket("session-1");
        const now = Date.now();
        const io = createAuthorizedIO({
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: [socket],
                    hibernatedUsers: new Map([[socket, { id: "ada" }]]),
                    lastPings: new Map([[socket, now]]),
                    serializedStates: new Map([
                        [
                            socket,
                            {
                                kind: "user",
                                operator: null,
                                presence: null,
                                quit: false,
                                room: roomId,
                                seq: { presence: null },
                                timers: { ping: now },
                            },
                        ],
                    ]),
                }),
        });
        const room = io.server().createRoom(roomId);

        expect(manageSessions(room).getSize()).toBe(1);
    });
});

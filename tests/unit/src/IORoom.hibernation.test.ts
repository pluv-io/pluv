import { yjs } from "@pluv/crdt-yjs";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate, encodeStateVector } from "yjs";
import { describe, expect, it, vi } from "vitest";
import {
    createAuthorizedIO,
    encodedStateWithContent,
    registerAuthorized,
    TestPersistence,
    TestPlatform,
    TestSocket,
} from "./__utils__";

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

describe("IORoom hibernation", () => {
    it("does not evict a hibernated socket with a recent auto-response ping", async () => {
        const roomId = "hibernated-heartbeat";
        const socket = new TestSocket("session-1");
        const persistence = new TestPersistence();
        const onStorageDestroyed = vi.fn();
        const now = Date.now();

        await persistence.setStorageState(roomId, encodedStateWithContent("current"));

        const io = createAuthorizedIO({
            crdt: yjs,
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: [socket],
                    hibernatedUsers: new Map([[socket, { id: "session-1" }]]),
                    lastPings: new Map([[socket, now]]),
                    mode: "detached",
                    persistence,
                    serializedStates: new Map([
                        [
                            socket,
                            {
                                presence: null,
                                quit: false,
                                room: roomId,
                                timers: {
                                    ping: now - 60_000,
                                    presence: null,
                                },
                            },
                        ],
                    ]),
                }),
        });
        const server = io.server({
            getInitialStorage: () => Promise.resolve(null),
            onStorageDestroyed,
        });
        const room = server.createRoom(roomId);

        expect(room.getSize()).toBe(1);

        await room.garbageCollect();

        expect(room.getSize()).toBe(1);
        expect(onStorageDestroyed).not.toHaveBeenCalled();

        const stored = await persistence.getStorageState(roomId);
        const clientDoc = new YDoc();

        applyUpdate(clientDoc, Buffer.from(stored!, "base64"));

        const stateVector = encodeStateVector(clientDoc);
        const content = clientDoc.getText("content");

        content.insert(content.length, " latest");

        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$updateStorage",
                data: {
                    origin: null,
                    update: Buffer.from(encodeStateAsUpdate(clientDoc, stateVector)).toString(
                        "base64",
                    ),
                },
            }),
        });

        const updated = new YDoc();
        const updatedState = await persistence.getStorageState(roomId);

        applyUpdate(updated, Buffer.from(updatedState!, "base64"));

        expect(updated.getText("content").toJSON()).toBe("current latest");
    });

    it("keeps a hibernated socket in stats, listUsers, and $getOthers", async () => {
        const roomId = "hibernated-occupancy";
        const socket = new TestSocket("session-1");
        const now = Date.now();
        const io = createAuthorizedIO({
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: [socket],
                    hibernatedUsers: new Map([[socket, { id: "ada" }]]),
                    lastPings: new Map([[socket, now]]),
                    mode: "detached",
                    serializedStates: new Map([
                        [
                            socket,
                            {
                                presence: { cursor: 1 },
                                quit: false,
                                room: roomId,
                                timers: {
                                    ping: now - 60_000,
                                    presence: now,
                                },
                            },
                        ],
                    ]),
                }),
        });
        const room = io.server().createRoom(roomId);
        const observer = new TestSocket("session-2");

        expect(room.getSize()).toBe(1);
        expect(room.listUsers()).toEqual({
            success: true,
            pageInfo: { endCursor: "ada", hasNextPage: false },
            users: [{ data: { id: "ada" } }],
        });

        await registerAuthorized(room, observer, { io, user: { id: "bob" } });
        await room.garbageCollect();

        expect(room.getSize()).toBe(2);
        expect(room.listUsers({ limit: 10 })).toEqual({
            success: true,
            pageInfo: { endCursor: "bob", hasNextPage: false },
            users: [{ data: { id: "ada" } }, { data: { id: "bob" } }],
        });

        await room.onMessage(observer)({
            data: JSON.stringify({
                type: "$getOthers",
                data: {},
            }),
        });

        expect(lastMessage(observer, "$othersReceived").data.others).toEqual([
            {
                connectionIds: ["session-1"],
                data: { id: "ada" },
                presence: { cursor: 1 },
                timers: { presence: expect.any(Number) },
            },
        ]);
        expect(lastMessage(observer, "$othersReceived").data.myConnectionIds).toEqual([
            "session-2",
        ]);
    });
});

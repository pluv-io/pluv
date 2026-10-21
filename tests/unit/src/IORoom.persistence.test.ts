import { AbstractPlatform, manageSessions } from "@pluv/io";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate, encodeStateVector } from "yjs";
import { describe, expect, it } from "vitest";
import {
    createAuthorizedIO,
    encodedStateWithContent,
    registerAuthorized,
    TestPersistence,
    TestPlatform,
    TestSocket,
    testYjsTreaty,
    tick,
    waitForStorageSnapshot,
    waitUntil,
} from "./__utils__";

const ROOM_ID = "repeated-persistence";

/** Reads `keepAlive` through its descriptor so the reference stays bound to the instance that calls it. */
const readKeepAlive = (): {
    invoke: AbstractPlatform["keepAlive"];
    restore: () => void;
} => {
    const descriptor = Object.getOwnPropertyDescriptor(AbstractPlatform.prototype, "keepAlive");
    const invoke: unknown = descriptor?.value;

    if (!descriptor || typeof invoke !== "function") {
        throw new Error("keepAlive is missing");
    }

    return {
        invoke: invoke as AbstractPlatform["keepAlive"],
        restore: () => {
            Object.defineProperty(AbstractPlatform.prototype, "keepAlive", descriptor);
        },
    };
};

const decodeText = (encodedState: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));

    return doc.getText("content").toJSON();
};

const appendUpdate = (encodedState: string, text: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));

    const stateVector = encodeStateVector(doc);
    const content = doc.getText("content");

    content.insert(content.length, text);

    return Buffer.from(encodeStateAsUpdate(doc, stateVector)).toString("base64");
};

const getRegisteredState = (socket: TestSocket): string => {
    const state = socket.messages.find(({ type }) => type === "$registered")?.data?.state;

    if (typeof state !== "string") throw new Error("Socket was not registered with storage");

    return state;
};

const fullState = (encodedState: string, update?: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));
    if (update) applyUpdate(doc, Buffer.from(update, "base64"));

    const encoded = Buffer.from(encodeStateAsUpdate(doc)).toString("base64");

    doc.destroy();

    return encoded;
};

const updateStorage = async (
    room: { onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void> },
    socket: TestSocket,
    update: string,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$updateStorage",
            data: { origin: null, update },
        }),
    });
};

describe("IORoom repeated persistence", () => {
    it("persists edits made after restoring an externally saved document", async () => {
        let externalStorage = encodedStateWithContent("initial");

        const io = createAuthorizedIO({
            treaty: testYjsTreaty,
        });
        const server = io.server({
            getInitialStorage: () => Promise.resolve(externalStorage),
            onStorageDestroyed: ({ encodedState }) => {
                if (encodedState) externalStorage = encodedState;
            },
        });

        const firstRoom = manageSessions(server.createRoom(ROOM_ID));
        const firstSocket = new TestSocket("session-1");

        await registerAuthorized(firstRoom, firstSocket, { io });
        await updateStorage(
            firstRoom,
            firstSocket,
            appendUpdate(getRegisteredState(firstSocket), " first"),
        );
        await firstRoom.evictAll();

        expect(decodeText(externalStorage)).toBe("initial first");

        const secondRoom = manageSessions(server.createRoom(ROOM_ID));
        const secondSocket = new TestSocket("session-2");

        await registerAuthorized(secondRoom, secondSocket, { io });
        await updateStorage(
            secondRoom,
            secondSocket,
            appendUpdate(getRegisteredState(secondSocket), " second"),
        );
        await secondRoom.evictAll();

        expect(decodeText(externalStorage)).toBe("initial first second");

        const thirdRoom = manageSessions(server.createRoom(ROOM_ID));
        const thirdSocket = new TestSocket("session-3");

        await registerAuthorized(thirdRoom, thirdSocket, { io });

        expect(decodeText(getRegisteredState(thirdSocket))).toBe("initial first second");
    });

    it("preserves newer Durable Object storage across hibernation and reload", async () => {
        let externalStorage = encodedStateWithContent("initial");
        let hibernatedSockets: readonly TestSocket[] = [];
        let initialStorageReads = 0;
        const persistence = new TestPersistence();

        const io = createAuthorizedIO({
            treaty: testYjsTreaty,
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: hibernatedSockets,
                    hibernatedUsers: new Map(
                        hibernatedSockets.map((socket) => [socket, { id: socket.id }]),
                    ),
                    persistence,
                    serializedStates: new Map(
                        hibernatedSockets.map((socket) => [
                            socket,
                            {
                                kind: "user",
                                operator: null,
                                presence: null,
                                quit: false,
                                room: ROOM_ID,
                                seq: { presence: null },
                                timers: { ping: Date.now() },
                            },
                        ]),
                    ),
                }),
        });
        const server = io.server({
            getInitialStorage: () => {
                initialStorageReads += 1;

                return Promise.resolve(externalStorage);
            },
            onStorageDestroyed: ({ encodedState }) => {
                if (encodedState) externalStorage = encodedState;
            },
        });

        const firstRoom = manageSessions(server.createRoom(ROOM_ID));
        const firstSocket = new TestSocket("session-1");

        await registerAuthorized(firstRoom, firstSocket, { io });
        await updateStorage(
            firstRoom,
            firstSocket,
            appendUpdate(getRegisteredState(firstSocket), " first"),
        );
        await waitForStorageSnapshot();

        hibernatedSockets = [firstSocket];

        const firstWake = manageSessions(server.createRoom(ROOM_ID));

        await firstWake.onClose(firstSocket)({ code: 1_000, reason: "reload" });
        expect(initialStorageReads).toBe(1);

        const secondSocket = new TestSocket("session-2");

        await registerAuthorized(firstWake, secondSocket, { io });
        expect(decodeText(getRegisteredState(secondSocket))).toBe("initial first");
        expect(initialStorageReads).toBe(2);

        await updateStorage(
            firstWake,
            secondSocket,
            appendUpdate(getRegisteredState(secondSocket), " second"),
        );
        await waitForStorageSnapshot();

        hibernatedSockets = [secondSocket];

        const secondWake = manageSessions(server.createRoom(ROOM_ID));

        await secondWake.onClose(secondSocket)({ code: 1_000, reason: "reload" });
        expect(initialStorageReads).toBe(2);

        const thirdSocket = new TestSocket("session-3");

        await registerAuthorized(secondWake, thirdSocket, { io });

        expect(decodeText(getRegisteredState(thirdSocket))).toBe("initial first second");
        expect(decodeText(externalStorage)).toBe("initial first second");
        expect(initialStorageReads).toBe(3);
    });

    it("retries a failed snapshot on the same clock", async () => {
        const roomId = "snapshot-retry";
        const persistence = new TestPersistence();
        let attempts = 0;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            attempts += 1;

            if (attempts === 1) return Promise.reject(new Error("storage unavailable"));

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({ getInitialStorage: () => encodedStateWithContent("initial") })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));
        await waitForStorageSnapshot();

        expect(await persistence.getStorageState(roomId)).toBeNull();

        await waitForStorageSnapshot();

        expect(decodeText((await persistence.getStorageState(roomId)) ?? "")).toBe("initial edit");
        expect(attempts).toBe(2);
    });

    it("retries a client seed when the first snapshot fails", async () => {
        const roomId = "snapshot-seed-retry";
        const persistence = new TestPersistence();
        let attempts = 0;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            attempts += 1;

            if (attempts === 1) return Promise.reject(new Error("storage unavailable"));

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io.server({ getInitialStorage: () => null }).createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$initializeSession",
                data: { presence: {}, update: encodedStateWithContent("seeded") },
            }),
        });

        expect(
            socket.messages.find((message) => message.type === "$storageReceived")?.data.changeKind,
        ).toBe("initialized");
        expect(await persistence.getStorageState(roomId)).toBeNull();

        await waitForStorageSnapshot();

        expect(decodeText((await persistence.getStorageState(roomId)) ?? "")).toBe("seeded");
        expect(attempts).toBe(2);
    });

    it("notifies onStorageSnapshot once when a client seed retries", async () => {
        const roomId = "snapshot-seed-retry-listener";
        const persistence = new TestPersistence();
        let attempts = 0;
        const store = persistence.setStorageState.bind(persistence);
        const updates: string[] = [];

        persistence.setStorageState = (room, state) => {
            attempts += 1;

            if (attempts === 1) return Promise.reject(new Error("storage unavailable"));

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({
                    getInitialStorage: () => null,
                    onStorageSnapshot: (event) => {
                        if (typeof event.encodedState !== "string") return;

                        updates.push(event.encodedState);
                    },
                })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await room.onMessage(socket)({
            data: JSON.stringify({
                type: "$initializeSession",
                data: { presence: {}, update: encodedStateWithContent("seeded") },
            }),
        });

        expect(updates).toEqual([]);
        expect(
            socket.messages.find((message) => message.type === "$storageReceived")?.data.changeKind,
        ).toBe("initialized");

        await waitForStorageSnapshot();

        expect(updates).toHaveLength(1);
        expect(decodeText(updates[0] ?? "")).toBe("seeded");
    });

    it("snapshots two edits in one interval as one snapshot", async () => {
        const roomId = "snapshot-coalesce";
        const persistence = new TestPersistence();
        let snapshots = 0;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            snapshots += 1;

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({ getInitialStorage: () => encodedStateWithContent("initial") })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });

        const base = getRegisteredState(socket);
        const first = appendUpdate(base, " one");

        await updateStorage(room, socket, first);
        await updateStorage(room, socket, appendUpdate(fullState(base, first), " two"));

        expect(snapshots).toBe(0);
        expect(await persistence.getStorageState(roomId)).toBeNull();

        await waitForStorageSnapshot();

        expect(snapshots).toBe(1);
        expect(decodeText((await persistence.getStorageState(roomId)) ?? "")).toBe(
            "initial one two",
        );

        await waitForStorageSnapshot();

        expect(snapshots).toBe(1);
    });

    it("stores the shutdown copy without waiting out the interval", async () => {
        const roomId = "snapshot-shutdown";
        const persistence = new TestPersistence();
        let snapshots = 0;
        let stored = "";
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            snapshots += 1;
            stored = state;

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({ getInitialStorage: () => encodedStateWithContent("initial") })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });

        const started = Date.now();

        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " now"));
        await room.evictAll();

        expect(Date.now() - started).toBeLessThan(1_000);
        expect(snapshots).toBe(1);
        expect(decodeText(stored)).toBe("initial now");
    });

    it("deletes the initialized store when shutdown persistence is a new object", async () => {
        const roomId = "snapshot-shutdown-fork";
        const backing = new TestPersistence();

        class ForkedPersistence extends TestPersistence {
            public constructor(
                private readonly live: boolean,
                private readonly store: TestPersistence,
            ) {
                super();
            }

            public override initialize(): this {
                return new ForkedPersistence(true, this.store) as this;
            }

            public override setStorageState(room: string, state: string): Promise<void> {
                if (!this.live) return Promise.resolve();

                return this.store.setStorageState(room, state);
            }

            public override deleteStorageState(room: string): Promise<void> {
                if (!this.live) return Promise.resolve();

                return this.store.deleteStorageState(room);
            }
        }

        const io = createAuthorizedIO({
            platform: { persistence: new ForkedPersistence(false, backing) },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({ getInitialStorage: () => encodedStateWithContent("initial") })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " now"));
        await room.evictAll();

        expect(await backing.getStorageState(roomId)).toBeNull();
    });

    it("does not let a queued snapshot replace the shutdown copy", async () => {
        const roomId = "snapshot-after-destroy";
        const persistence = new TestPersistence();
        let snapshots = 0;
        let stored = "";
        let releaseSnapshot: (() => void) | undefined;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            snapshots += 1;
            stored = state;

            if (snapshots > 1) return store(room, state);

            return new Promise<void>((resolve) => {
                releaseSnapshot = resolve;
            }).then(() => store(room, state));
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({ getInitialStorage: () => encodedStateWithContent("initial") })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));

        const evict = room.evictAll();

        await waitUntil(() => snapshots === 1);
        await waitForStorageSnapshot();

        releaseSnapshot?.();
        await evict;
        await tick();

        expect(snapshots).toBe(1);
        expect(decodeText(stored)).toBe("initial edit");
        expect(await persistence.getStorageState(roomId)).toBeNull();
    });

    it("includes one listener write and then finishes shutdown", async () => {
        const roomId = "snapshot-listener-seal";
        const persistence = new TestPersistence();
        let snapshots = 0;
        let stored = "";
        let notices = 0;
        let ydoc: YDoc | undefined;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            snapshots += 1;
            stored = state;

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const server = io.server({
            getInitialStorage: () => encodedStateWithContent("initial"),
            onStorageSnapshot: () => {
                notices += 1;

                if (!ydoc) return;

                const text = ydoc.getText("content");

                text.insert(text.length, "!");
            },
            router: io.router({
                grab: io.procedure.broadcast((_data, ctx) => {
                    ydoc = (ctx.doc as { value: YDoc }).value;

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom(roomId));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await room.onMessage(socket)({
            data: JSON.stringify({ type: "grab", data: {} }),
        });
        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));
        await room.evictAll();

        expect(notices).toBe(1);
        expect(snapshots).toBe(2);
        expect(decodeText(stored)).toBe("initial edit!");
    });

    it("does not keep the snapshot clock alive when a listener writes on every snapshot", async () => {
        const roomId = "snapshot-listener-clock";
        const persistence = new TestPersistence();
        let snapshots = 0;
        let ydoc: YDoc | undefined;
        const store = persistence.setStorageState.bind(persistence);

        persistence.setStorageState = (room, state) => {
            snapshots += 1;

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const server = io.server({
            getInitialStorage: () => encodedStateWithContent("initial"),
            onStorageSnapshot: () => {
                if (!ydoc) return;

                const text = ydoc.getText("content");

                text.insert(text.length, "!");
            },
            router: io.router({
                grab: io.procedure.broadcast((_data, ctx) => {
                    ydoc = (ctx.doc as { value: YDoc }).value;

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom(roomId));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await room.onMessage(socket)({
            data: JSON.stringify({ type: "grab", data: {} }),
        });
        await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));
        await waitForStorageSnapshot();

        expect(snapshots).toBe(2);
        expect(decodeText((await persistence.getStorageState(roomId)) ?? "")).toBe("initial edit!");

        await waitForStorageSnapshot();

        expect(snapshots).toBe(2);
    });

    it("broadcasts a listener write to connected clients", async () => {
        const roomId = "snapshot-listener-broadcast";
        const persistence = new TestPersistence();
        let snapshots = 0;
        const store = persistence.setStorageState.bind(persistence);
        let ydoc: YDoc | undefined;

        persistence.setStorageState = (room, state) => {
            snapshots += 1;

            return store(room, state);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const server = io.server({
            getInitialStorage: () => encodedStateWithContent("initial"),
            onStorageSnapshot: () => {
                if (!ydoc) return;

                const text = ydoc.getText("content");

                text.insert(text.length, "!");
            },
            router: io.router({
                grab: io.procedure.broadcast((_data, ctx) => {
                    ydoc = (ctx.doc as { value: YDoc }).value;

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom(roomId));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const storageUpdates = (socket: TestSocket): string[] =>
            socket.messages
                .filter((message) => message.type === "$storageUpdated")
                .map((message) => message.data.state as string);
        const applied = (socket: TestSocket): string =>
            decodeText(
                storageUpdates(socket).reduce(
                    (encoded, update) => fullState(encoded, update),
                    getRegisteredState(socket),
                ),
            );

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await room.onMessage(first)({
            data: JSON.stringify({ type: "grab", data: {} }),
        });
        await updateStorage(room, first, appendUpdate(getRegisteredState(first), " edit"));

        expect(applied(first)).toBe("initial edit");
        expect(applied(second)).toBe("initial edit");

        await waitForStorageSnapshot();

        expect(applied(first)).toBe("initial edit!");
        expect(applied(second)).toBe("initial edit!");
        expect(snapshots).toBe(2);

        await waitForStorageSnapshot();

        expect(storageUpdates(second)).toHaveLength(2);
        expect(snapshots).toBe(2);
    });

    it("does not retry or block destroy when storage is over the limit", async () => {
        const roomId = "snapshot-over-limit";
        const persistence = new TestPersistence();
        let snapshots = 0;
        let destroyed = false;
        const store = persistence.setStorageState.bind(persistence);
        const report = console.error;

        persistence.setStorageState = (room, state) => {
            snapshots += 1;

            return store(room, state);
        };
        console.error = () => undefined;

        const io = createAuthorizedIO({
            limits: { storageMaxSize: 1 },
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({
                    getInitialStorage: () => null,
                    onRoomDestroyed: () => {
                        destroyed = true;
                    },
                })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        try {
            await registerAuthorized(room, socket, { io });
            await updateStorage(
                room,
                socket,
                appendUpdate(encodedStateWithContent(""), " too big"),
            );

            expect(socket.messages.some((message) => message.type === "$error")).toBe(true);

            await waitForStorageSnapshot();
            await waitForStorageSnapshot();

            expect(snapshots).toBe(0);

            await room.evictAll();

            expect(destroyed).toBe(true);
            expect(snapshots).toBe(0);
        } finally {
            console.error = report;
        }
    });

    it("keeps a listener promise alive without waiting for it", async () => {
        const roomId = "snapshot-listener-keepalive";
        const persistence = new TestPersistence();
        let snapshots = 0;
        const store = persistence.setStorageState.bind(persistence);
        let release: () => void = () => undefined;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        const tracked: { settled: boolean }[] = [];
        const keepAlive = readKeepAlive();

        persistence.setStorageState = (room, state) => {
            snapshots += 1;

            return store(room, state);
        };
        AbstractPlatform.prototype.keepAlive = function (promise) {
            const record = { settled: false };

            tracked.push(record);
            void promise.finally(() => {
                record.settled = true;
            });

            return keepAlive.invoke.call(this, promise);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({
                    getInitialStorage: () => encodedStateWithContent("initial"),
                    onStorageSnapshot: () => pending,
                })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        try {
            await registerAuthorized(room, socket, { io });
            await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));
            await waitForStorageSnapshot();
            await Promise.resolve();

            expect(snapshots).toBe(1);
            expect(tracked.some((record) => !record.settled)).toBe(true);

            await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " again"));

            const waiting = tracked.filter((record) => !record.settled).length;

            expect(snapshots).toBe(1);

            release();
            await pending;
            await Promise.resolve();

            expect(tracked.filter((record) => !record.settled)).toHaveLength(waiting - 1);
        } finally {
            keepAlive.restore();
            release();
        }
    });

    it("keeps an onRoomMessage promise alive without waiting for it", async () => {
        const roomId = "message-listener-keepalive";
        let release: () => void = () => undefined;
        const pending = new Promise<void>((resolve) => {
            release = resolve;
        });
        const tracked: { settled: boolean }[] = [];
        const keepAlive = readKeepAlive();

        AbstractPlatform.prototype.keepAlive = function (promise) {
            const record = { settled: false };

            tracked.push(record);
            void promise.finally(() => {
                record.settled = true;
            });

            return keepAlive.invoke.call(this, promise);
        };

        const io = createAuthorizedIO({
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({
                    getInitialStorage: () => null,
                    onRoomMessage: () => pending,
                })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        try {
            await registerAuthorized(room, socket, { io });

            const handled = room.onMessage(socket)({
                data: JSON.stringify({ type: "note", data: { text: "hi" } }),
            });

            await handled;
            await Promise.resolve();

            const waiting = tracked.filter((record) => !record.settled);

            expect(waiting.length).toBeGreaterThan(0);

            release();
            await pending;
            await Promise.resolve();
            await Promise.resolve();

            expect(waiting.every((record) => record.settled)).toBe(true);
        } finally {
            keepAlive.restore();
            release();
        }
    });

    it("logs a listener promise that rejects", async () => {
        const roomId = "snapshot-listener-reject";
        const persistence = new TestPersistence();
        const reported: unknown[] = [];
        const report = console.error;
        const failure = new Error("db down");

        console.error = (...args: unknown[]) => {
            reported.push(args[0]);
        };

        const io = createAuthorizedIO({
            platform: { persistence },
            treaty: testYjsTreaty,
        });
        const room = manageSessions(
            io
                .server({
                    getInitialStorage: () => encodedStateWithContent("initial"),
                    onStorageSnapshot: () => Promise.reject(failure),
                })
                .createRoom(roomId),
        );
        const socket = new TestSocket("session-1");

        try {
            await registerAuthorized(room, socket, { io });
            await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " edit"));
            await waitForStorageSnapshot();
            await updateStorage(room, socket, appendUpdate(getRegisteredState(socket), " again"));

            expect(reported).toContain(failure);
        } finally {
            console.error = report;
        }
    });
});

import { manageSessions } from "@pluv/io";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    deferred,
    registerAuthorized,
    TestPersistence,
    TestSocket,
    testAuthorizeUser,
    tick,
    waitForStorageSnapshot,
} from "./__utils__";

const presence = z.object({
    selectionId: z.string().nullable(),
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
    .resolve(({ id }) => ({ selectionId: id }));
const addMessage = t.procedure.storage
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { storage: docStorage }) => {
        docStorage.messages.push([text]);
    });
const touch = t.procedure.storage.input(z.object({})).resolve(() => undefined);
const treaty = t.router({ select, addMessage, touch });

type Room = {
    id: string;
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket, ...options: any[]) => Promise<void>;
    __experimental_presence: (actor: { senderId: string }) => {
        select: (input: { id: string | null }) => Promise<void>;
    };
    __experimental_storage: (actor: { senderId: string }) => {
        addMessage: (input: { text: string }) => Promise<void>;
        touch: (input: Record<string, never>) => Promise<void>;
    };
};

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
    sessionPresence: Record<string, unknown>,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$initializeSession",
            data: { presence: sessionPresence, update: null },
        }),
    });
};

describe("IORoom treaty invoke", () => {
    const createRoom = (roomId: string = "treaty-invoke") => {
        const io = createAuthorizedIO({
            treaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom(roomId));

        return { io, room };
    };

    it("requires a valid actor and live connection for presence and storage", async () => {
        const { room } = createRoom();

        expect(() => room.__experimental_presence(null as never)).toThrow(/senderId: string/);
        expect(() => room.__experimental_presence({ senderId: undefined as never })).toThrow(
            /senderId: string/,
        );
        await expect(
            room.__experimental_storage({ senderId: "missing" }).addMessage({ text: "hello" }),
        ).rejects.toThrow(/Unknown senderId/);
    });

    it("does not treat bound procedure proxies as thenables", async () => {
        const { io, room } = createRoom("treaty-thenable");
        const first = new TestSocket("session-1");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });

        const boundPresence = room.__experimental_presence({ senderId: first.id });

        await expect(Promise.resolve(boundPresence)).resolves.toBe(boundPresence);

        const boundStorage = room.__experimental_storage({ senderId: first.id });

        await expect((async () => boundStorage)()).resolves.toBe(boundStorage);
        expect(typeof boundStorage.addMessage).toBe("function");
    });

    it("keeps the senderId from bind time when the actor object is mutated", async () => {
        const { io, room } = createRoom("treaty-bind-sender");
        const first = new TestSocket("session-1");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });

        const actor = { senderId: first.id };
        const boundStorage = room.__experimental_storage(actor);

        actor.senderId = "missing";

        await boundStorage.addMessage({ text: "hello" });

        expect(lastMessage(first, "$storageUpdated").type).toBe("$storageUpdated");
    });

    it("applies presence through $updatePresence limits and $presenceUpdated", async () => {
        const { io, room } = createRoom();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        await room.__experimental_presence({ senderId: first.id }).select({ id: "item-1" });

        expect(lastMessage(second, "$presenceUpdated").data.session.presence).toEqual({
            selectionId: "item-1",
        });
        expect(lastMessage(second, "$presenceUpdated").data.user).toEqual({ id: "session-1" });
    });

    it("applies storage through persist and $storageUpdated without double-applying", async () => {
        const { io, room } = createRoom("treaty-storage");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        await room.__experimental_storage({ senderId: first.id }).addMessage({ text: "hello" });

        const firstUpdate = lastMessage(second, "$storageUpdated").data.state as string;
        const once = storage.getEmpty().applyEncodedState({ update: firstUpdate });

        expect(once.toJson()).toEqual({ messages: ["hello"] });
        once.destroy();

        await room.__experimental_storage({ senderId: first.id }).addMessage({ text: "again" });

        const secondUpdate = lastMessage(second, "$storageUpdated").data.state as string;
        const both = storage
            .getEmpty()
            .applyEncodedState({ update: firstUpdate })
            .applyEncodedState({ update: secondUpdate });
        const onlySecond = storage.getEmpty().applyEncodedState({ update: secondUpdate });

        expect(secondUpdate).not.toBe(firstUpdate);
        expect(both.toJson()).toEqual({ messages: ["hello", "again"] });
        expect(onlySecond.toJson()).not.toEqual({ messages: ["hello", "again"] });
        both.destroy();
        onlySecond.destroy();

        const beforeTouch = second.messages.filter((message) => message.type === "$storageUpdated");

        await room.__experimental_storage({ senderId: first.id }).touch({});

        expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual(
            beforeTouch,
        );
    });

    it("broadcasts a prepared storage write after the load", async () => {
        const gate = deferred<string>();
        let landed: string | null = null;
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => {
                const extra = await gate.promise;

                return `${text}:${extra}`;
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
                landed = loaded;
            });
        const preparedTreaty = local.router({ addPrepared });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const before = second.messages.filter((message) => message.type === "$storageUpdated");
        const pending = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "hello" });

        await tick();

        expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual(
            before,
        );
        expect(landed).toBeNull();

        gate.resolve("there");
        await pending;

        expect(landed).toBe("hello:there");

        const added = second.messages
            .filter((message) => message.type === "$storageUpdated")
            .slice(before.length);
        const doc = storage.getEmpty();

        expect(added).toHaveLength(1);
        doc.applyEncodedState({ update: added[0]?.data.state as string });
        expect(doc.toJson()).toEqual({ messages: ["hello:there"] });
        doc.destroy();
    });

    it("does not broadcast a prepared write that exceeds the storage limit", async () => {
        const gate = deferred<string>();
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => {
                const extra = await gate.promise;

                return `${text}:${extra}`;
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
            });
        const preparedTreaty = local.router({ addPrepared });
        const io = createAuthorizedIO({
            limits: { storageMaxSize: 1 },
            treaty: preparedTreaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-limit"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const pending = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "hello" });

        await tick();
        gate.resolve("there");

        await expect(pending).rejects.toThrow(/Large Storage/);
        await waitForStorageSnapshot();

        expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual([]);
    });

    it("rejects a host call when prepare fails", async () => {
        const error = new Error("load failed");
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({}))
            .prepare(async () => {
                throw error;
            })
            .resolve(() => undefined);
        const addTyped = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => text)
            .resolve((_input, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
            });
        const preparedTreaty = local.router({ addPrepared, addTyped });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-error"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const doc = yjs.schema({ messages: yjs.yArray(s.string()) }).getEmpty();

        try {
            await registerAuthorized(room, first, { io });
            await initializeSession(room, first, { selectionId: null });
            await registerAuthorized(room, second, { io });
            await initializeSession(room, second, { selectionId: null });

            await expect(
                room.__experimental_storage({ senderId: first.id }).addPrepared({}),
            ).rejects.toThrow("load failed");
            await expect(
                room.__experimental_storage({ senderId: first.id }).addTyped({ text: 1 as never }),
            ).rejects.toThrow();
            await room.__experimental_storage({ senderId: first.id }).addTyped({ text: "kept" });

            const added = second.messages.filter((message) => message.type === "$storageUpdated");

            expect(added).toHaveLength(1);
            doc.applyEncodedState({ update: added[0]?.data.state as string });
            expect(doc.toJson()).toEqual({ messages: ["kept"] });
        } finally {
            doc.destroy();
        }
    });

    it("runs another storage write while prepare is waiting", async () => {
        const gate = deferred<string>();
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => {
                const extra = await gate.promise;

                return `${text}:${extra}`;
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
            });
        const addDuring = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .resolve(({ text }, { storage: docStorage }) => {
                docStorage.messages.push([text]);
            });
        const preparedTreaty = local.router({ addPrepared, addMessage: addDuring });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-queue"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const pending = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "hello" });

        await tick();

        const wroteDuring = room
            .__experimental_storage({ senderId: first.id })
            .addMessage({ text: "during" });
        const outcome = await Promise.race([
            wroteDuring.then(() => "wrote" as const),
            tick(5).then(() => "blocked" as const),
        ]);

        expect(outcome).toBe("wrote");
        await wroteDuring;

        const during = lastMessage(second, "$storageUpdated").data.state as string;
        const mid = storage.getEmpty().applyEncodedState({ update: during });

        expect(mid.toJson()).toEqual({ messages: ["during"] });
        mid.destroy();

        gate.resolve("there");
        await pending;

        const doc = storage.getEmpty();

        for (const message of second.messages.filter((entry) => entry.type === "$storageUpdated")) {
            doc.applyEncodedState({ update: message.data.state as string });
        }

        expect(doc.toJson()).toEqual({ messages: ["during", "hello:there"] });
        doc.destroy();
    });

    it("commits prepared writes in call order", async () => {
        const firstGate = deferred<void>();
        const secondGate = deferred<void>();
        let started = 0;
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => {
                started += 1;
                await (text === "first" ? firstGate.promise : secondGate.promise);

                return text;
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
            });
        const preparedTreaty = local.router({ addPrepared });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-order"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const earlier = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "first" });

        await tick();

        const later = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "second" });

        await tick();
        expect(started).toBe(2);

        secondGate.resolve();
        await tick();

        expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual([]);

        firstGate.resolve();
        await earlier;
        await later;

        const doc = storage.getEmpty();

        for (const message of second.messages.filter((entry) => entry.type === "$storageUpdated")) {
            doc.applyEncodedState({ update: message.data.state as string });
        }

        expect(doc.toJson()).toEqual({ messages: ["first", "second"] });
        doc.destroy();
    });

    it("still writes a prepared update after the sender leaves", async () => {
        const gate = deferred<string>();
        let landed: string | null = null;
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async ({ text }) => {
                const extra = await gate.promise;

                return `${text}:${extra}`;
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
                landed = loaded;
            });
        const preparedTreaty = local.router({ addPrepared });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-left"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const pending = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "hello" });

        await tick();
        await room.evict(first.id);

        gate.resolve("there");
        await pending;

        expect(landed).toBe("hello:there");

        const doc = storage.getEmpty();

        doc.applyEncodedState({
            update: lastMessage(second, "$storageUpdated").data.state as string,
        });
        expect(doc.toJson()).toEqual({ messages: ["hello:there"] });
        doc.destroy();
    });

    it("rejects a prepared write after the room is destroyed", async () => {
        const gate = deferred<void>();
        let wrote = false;
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async () => {
                await gate.promise;

                return "late";
            })
            .resolve((_data, { storage: docStorage }, loaded) => {
                wrote = true;
                docStorage.messages.push([loaded]);
            });
        const addKept = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .resolve(({ text }, { storage: docStorage }) => {
                docStorage.messages.push([text]);
            });
        const preparedTreaty = local.router({ addPrepared, addMessage: addKept });
        let destroyed = false;
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
            onRoomDestroyed: () => {
                destroyed = true;
            },
        });
        const room = manageSessions(server.createRoom("treaty-prepare-destroyed"));
        const first = new TestSocket("session-1");
        const next = new TestSocket("session-2");
        const viewer = new TestSocket("session-3");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });

        const pending = room
            .__experimental_storage({ senderId: first.id })
            .addPrepared({ text: "hello" });

        await tick();
        await room.evictAll();

        expect(destroyed).toBe(true);

        await registerAuthorized(room, next, { io });
        await initializeSession(room, next, { selectionId: null });
        await registerAuthorized(room, viewer, { io });
        await initializeSession(room, viewer, { selectionId: null });

        gate.resolve();
        await expect(pending).rejects.toThrow("The room closed before this storage write");
        expect(wrote).toBe(false);

        await room.__experimental_storage({ senderId: next.id }).addMessage({ text: "kept" });

        const doc = storage.getEmpty();

        doc.applyEncodedState({
            update: lastMessage(viewer, "$storageUpdated").data.state as string,
        });
        expect(doc.toJson()).toEqual({ messages: ["kept"] });
        doc.destroy();
    });

    it("resolve sees the presence from the call", async () => {
        const gate = deferred<void>();
        let seen: string | null = "unset";
        const local = createTreaty({
            user: testAuthorizeUser,
            presence,
            storage,
        });
        const selectItem = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(({ id }) => ({ selectionId: id }));
        const addPrepared = local.procedure.storage
            .input(z.object({}))
            .prepare(async () => {
                await gate.promise;

                return "loaded";
            })
            .resolve((_data, { presence: snapshot }) => {
                seen = snapshot.selectionId;
            });
        const preparedTreaty = local.router({ selectItem, addPrepared });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = manageSessions(server.createRoom("treaty-prepare-actor"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const pending = room.__experimental_storage({ senderId: first.id }).addPrepared({});

        await tick();
        await room.__experimental_presence({ senderId: first.id }).selectItem({ id: "item-9" });

        gate.resolve();
        await pending;

        expect(seen).toBeNull();
    });

    it("broadcasts a storage procedure while an earlier update is still pending", async () => {
        const { io, room } = createRoom("treaty-storage-pending");
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        const source = storage.getInitialized();

        source.get("messages").push(["hidden"]);

        const later = source.captureUpdate(() => {
            source.get("messages").push(["tail"]);
        });

        source.destroy();

        if (!later) throw new Error("Expected a later update");

        await room.onMessage(first)({
            data: JSON.stringify({
                type: "$updateStorage",
                data: { origin: null, update: later },
            }),
        });

        expect(second.messages.some((message) => message.type === "$storageUpdated")).toBe(false);

        await room.__experimental_storage({ senderId: first.id }).addMessage({ text: "kept" });

        const echoed = lastMessage(second, "$storageUpdated").data.state as string;
        const doc = storage.getEmpty().applyEncodedState({ update: echoed });

        expect(doc.toJson()).toEqual({ messages: ["kept"] });
        doc.destroy();
    });

    it("persists a disconnect listener's storage procedure before destroy", async () => {
        const persistence = new TestPersistence();
        const roomId = "storage-after-destroy";
        let room!: Room & { evictAll: () => Promise<void> };
        let late: Promise<void> = Promise.resolve();
        let queued = false;
        let destroyed = false;
        const io = createAuthorizedIO({
            treaty,
            platform: { persistence },
        });
        const server = io.server({
            getInitialStorage: () => null,
            onRoomDestroyed: () => {
                destroyed = true;
            },
            onUserDisconnected: ({ user }) => {
                if (queued) return;

                queued = true;
                const senderId = user?.id === "session-1" ? "session-2" : "session-1";

                late = room.__experimental_storage({ senderId }).addMessage({ text: "after" });
            },
        });

        room = manageSessions(server.createRoom(roomId));

        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });
        await room.__experimental_storage({ senderId: first.id }).addMessage({ text: "hello" });

        await room.evictAll();
        await late;

        expect(destroyed).toBe(true);

        const doc = storage.getEmpty().applyEncodedState({
            update: (await persistence.getStorageState(roomId)) as string,
        });

        expect(doc.toJson()).toEqual({ messages: ["hello", "after"] });
        doc.destroy();
    });

    it("lets a disconnect listener await a storage procedure", async () => {
        const persistence = new TestPersistence();
        const roomId = "disconnect-awaits-storage";
        let room!: Room & { evict: (sessionId: string) => Promise<void>; getSize: () => number };
        const io = createAuthorizedIO({
            treaty,
            platform: { persistence },
        });
        const server = io.server({
            getInitialStorage: () => null,
            onUserDisconnected: ({ user }) => {
                if (user?.id !== "session-1") return Promise.resolve();

                return room.__experimental_storage({ senderId: "session-2" }).addMessage({
                    text: "from-disconnect",
                });
            },
        });

        room = manageSessions(server.createRoom(roomId));

        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        await room.evict("session-1");
        await waitForStorageSnapshot();

        const doc = storage.getEmpty().applyEncodedState({
            update: (await persistence.getStorageState(roomId)) as string,
        });

        expect(doc.toJson()).toEqual({ messages: ["from-disconnect"] });
        expect(room.getSize()).toBe(1);
        doc.destroy();
    });

    it("lets an event procedure await evict", async () => {
        const io = createAuthorizedIO({});
        let room!: {
            evict: (sessionId: string) => Promise<void>;
            getSize: () => number;
            id: string;
            onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
            register: (socket: TestSocket, ...options: any[]) => Promise<void>;
        };
        const server = io.server({
            router: io.router({
                kick: io.procedure.broadcast(async () => {
                    await room.evict("session-2");

                    return {};
                }),
            }),
        });

        room = manageSessions(server.createRoom("procedure-evict"));

        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await room.onMessage(first)({
            data: JSON.stringify({ type: "kick", data: {} }),
        });

        expect(room.getSize()).toBe(1);
        expect(lastMessage(first, "$exit").data.sessionId).toBe("session-2");
    });
});

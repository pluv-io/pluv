import { manageSessions } from "@pluv/io";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import {
    applyUpdate,
    Doc as YDoc,
    encodeStateAsUpdate,
    encodeStateVector,
    mergeUpdates,
} from "yjs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    deferred,
    registerAuthorized,
    TestPersistence,
    TestPlatform,
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
const addMessage = t.procedure.storage
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { storage: docStorage }) => {
        docStorage.messages.push([text]);
    });
const treaty = t.router({ addMessage });

type Edit = {
    operator: { id: string } | null;
    procedure: string | null;
    update: string;
    user: { id: string } | null;
};

const messagesFrom = (updates: readonly string[]): string[] => {
    const doc = new YDoc();

    for (const update of updates) {
        applyUpdate(doc, Buffer.from(update, "base64"));
    }

    const messages = doc.getArray("messages").toJSON() as string[];

    doc.destroy();

    return messages;
};

const incremental = (write: (doc: YDoc) => void): string => {
    const doc = new YDoc();
    const before = encodeStateVector(doc);

    write(doc);

    const update = Buffer.from(encodeStateAsUpdate(doc, before)).toString("base64");

    doc.destroy();

    return update;
};

const pair = (): { first: string; second: string } => {
    const doc = new YDoc();
    const beforeFirst = encodeStateVector(doc);

    doc.getArray("messages").push(["first"]);

    const first = Buffer.from(encodeStateAsUpdate(doc, beforeFirst)).toString("base64");
    const beforeSecond = encodeStateVector(doc);

    doc.getArray("messages").push(["second"]);

    const second = Buffer.from(encodeStateAsUpdate(doc, beforeSecond)).toString("base64");

    doc.destroy();

    return { first, second };
};

/** One peer can land while the other client's later bytes stay pending. */
const partial = (): { earlier: string; rest: string } => {
    const origin = new YDoc();
    const beforeEarlier = encodeStateVector(origin);

    origin.getArray("messages").push(["first"]);

    const earlier = Buffer.from(encodeStateAsUpdate(origin, beforeEarlier)).toString("base64");
    const beforeRest = encodeStateVector(origin);

    origin.getArray("messages").push(["second"]);

    const rest = encodeStateAsUpdate(origin, beforeRest);

    origin.destroy();

    const peer = new YDoc();

    peer.getArray("messages").push(["peer"]);

    const merged = Buffer.from(mergeUpdates([rest, encodeStateAsUpdate(peer)])).toString("base64");

    peer.destroy();

    return { earlier, rest: merged };
};

/** Three updates from one client. The later two cannot apply before the first. */
const pendingChain = (): { first: string; second: string; third: string } => {
    const doc = new YDoc();
    const take = (text: string): string => {
        const before = encodeStateVector(doc);
        doc.getArray("messages").push([text]);

        return Buffer.from(encodeStateAsUpdate(doc, before)).toString("base64");
    };
    const first = take("one");
    const second = take("two");
    const third = take("three");

    doc.destroy();

    return { first, second, third };
};

const send = async (
    room: { onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void> },
    socket: TestSocket,
    type: string,
    data: unknown,
): Promise<void> => {
    await room.onMessage(socket)({ data: JSON.stringify({ type, data }) });
};

const initialize = async (
    room: { onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void> },
    socket: TestSocket,
    update: string | null = null,
): Promise<void> => {
    await send(room, socket, "$initializeSession", {
        presence: { selectionId: null },
        update,
    });
};

describe("IORoom storage edits", () => {
    it("emits a prepared resolve with its actor, in call order of the bytes", async () => {
        const batches: Edit[][] = [];
        const gate = deferred<void>();
        const local = createTreaty({ user: testAuthorizeUser, presence, storage });
        const addPrepared = local.procedure.storage
            .input(z.object({ text: z.string() }))
            .prepare(async () => {
                await gate.promise;

                return "loaded";
            })
            .resolve((_input, { storage: docStorage }, loaded) => {
                docStorage.messages.push([loaded]);
            });
        const preparedTreaty = local.router({ addPrepared });
        const io = createAuthorizedIO({ treaty: preparedTreaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-prepare"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);

        const pending = room
            .__experimental_storage({ senderId: socket.id })
            .addPrepared({ text: "hello" });

        await tick();
        expect(batches).toEqual([]);

        gate.resolve();
        await pending;
        await waitForStorageSnapshot();

        expect(batches).toHaveLength(1);
        expect(batches[0]?.map((change) => change.procedure)).toEqual(["addPrepared"]);
        expect(batches[0]?.map((change) => change.user)).toEqual([{ id: "session-1" }]);
        expect(messagesFrom(batches[0]?.map((change) => change.update) ?? [])).toEqual(["loaded"]);
    });

    it("emits an out-of-order update after the earlier one, lower clock first", async () => {
        const batches: Edit[][] = [];
        const { first, second } = pair();
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-order"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", { origin: null, update: second });
        await send(room, socket, "$updateStorage", {
            origin: null,
            update: first,
            procedure: "addMessage",
        });
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.procedure)).toEqual(["addMessage", null]);
        expect(messagesFrom(changes.map((change) => change.update))).toEqual(["first", "second"]);
    });

    it("keeps a partial apply until the reserved update is covered", async () => {
        const batches: Edit[][] = [];
        const { earlier, rest } = partial();
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-partial"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", {
            origin: null,
            procedure: "addMessage",
            update: rest,
        });
        await waitForStorageSnapshot();

        expect(batches.flat()).toEqual([]);

        await send(room, socket, "$updateStorage", {
            origin: null,
            procedure: "addMessage",
            update: earlier,
        });
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.procedure)).toEqual(["addMessage", "addMessage"]);
        expect(changes.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
        ]);
        expect(messagesFrom(changes.map((change) => change.update)).sort()).toEqual([
            "first",
            "peer",
            "second",
        ]);
    });

    it("drops a partial update when the room closes before it is covered", async () => {
        const batches: Edit[][] = [];
        const { rest } = partial();
        const persistence = new TestPersistence();
        const io = createAuthorizedIO({
            platform: () => new TestPlatform({ persistence }),
            treaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-partial-destroy"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", {
            origin: null,
            procedure: "addMessage",
            update: rest,
        });
        await room.evictAll();

        const stored = await persistence.getStorageState("storage-edits-partial-destroy");

        expect(batches.flat()).toEqual([]);
        expect(messagesFrom([stored ?? ""])).toEqual(["peer"]);
    });

    it("drops waiting updates past the document size limit", async () => {
        const batches: Edit[][] = [];
        const { first, second, third } = pendingChain();
        const cap = Math.max(first.length, second.length, third.length);
        const io = createAuthorizedIO({
            limits: { storageMaxSize: cap },
            treaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-cap"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", { origin: null, update: second });
        await send(room, socket, "$updateStorage", { origin: null, update: third });
        await send(room, socket, "$updateStorage", {
            origin: null,
            procedure: "addMessage",
            update: first,
        });
        await waitForStorageSnapshot();

        const updates = batches.flat().map((change) => change.update);

        // `third` is still waiting when `first` arrives, and that apply covers it.
        // `second` was dropped on the earlier turn, while it was still waiting.
        expect(updates).toContain(first);
        expect(updates).toContain(third);
        expect(updates).not.toContain(second);
    });

    it("reports a storage update that is not readable", async () => {
        const batches: Edit[][] = [];
        const update = incremental((doc) => {
            doc.getArray("messages").push(["after"]);
        });
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-malformed"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", {
            origin: null,
            update: Buffer.from("garbage").toString("base64"),
        });

        expect(socket.messages.find((message) => message.type === "$error")?.data.message).toMatch(
            /Unexpected end of array/,
        );

        await send(room, socket, "$updateStorage", { origin: null, update });
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.user)).toEqual([{ id: "session-1" }]);
        expect(messagesFrom(changes.map((change) => change.update))).toEqual(["after"]);
    });

    it("emits a duplicate apply once it is covered", async () => {
        const batches: Edit[][] = [];
        const update = incremental((doc) => {
            doc.getArray("messages").push(["once"]);
        });
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-duplicate"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", { origin: null, update });
        await send(room, socket, "$updateStorage", { origin: null, update });
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes).toHaveLength(2);
        expect(changes[0]?.update).toBe(update);
        expect(changes[1]?.update).toBe(update);
        expect(messagesFrom(changes.map((change) => change.update))).toEqual(["once"]);
    });

    it("does not attribute a write that happens after await", async () => {
        const batches: Edit[][] = [];
        const gate = deferred<void>();
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
            router: io.router({
                write: io.procedure.broadcast(async (_input, { doc }) => {
                    await gate.promise;
                    doc.get("messages").push(["later"]);

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom("storage-edits-await"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);

        const pending = send(room, socket, "write", {});

        await tick();
        gate.resolve();
        await pending;
        await waitForStorageSnapshot();

        expect(batches.flat().map((change) => change.user)).toEqual([null]);
        expect(messagesFrom(batches.flat().map((change) => change.update))).toEqual(["later"]);
    });

    it("flushes waiting edits when the room is destroyed", async () => {
        const batches: Edit[][] = [];
        const update = incremental((doc) => {
            doc.getArray("messages").push(["seed"]);
        });
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-destroy"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket, update);
        await room.__experimental_storage({ senderId: socket.id }).addMessage({ text: "hello" });

        expect(batches).toEqual([]);

        const started = Date.now();

        await room.evictAll();

        expect(Date.now() - started).toBeLessThan(900);
        expect(batches).toHaveLength(1);
        expect(batches[0]?.map((change) => change.procedure)).toEqual([null, "addMessage"]);
        expect(batches[0]?.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
        ]);
        expect(messagesFrom(batches[0]?.map((change) => change.update) ?? [])).toEqual([
            "seed",
            "hello",
        ]);
    });

    it("emits an array delete with its actor", async () => {
        const batches: Edit[][] = [];
        const seed = incremental((doc) => {
            doc.getArray("messages").push(["gone"]);
        });
        const local = createTreaty({ user: testAuthorizeUser, presence, storage });
        const deleteMessage = local.procedure.storage
            .input(z.object({}))
            .resolve((_input, { storage: docStorage }) => {
                docStorage.messages.delete(0, 1);
            });
        const io = createAuthorizedIO({ treaty: local.router({ deleteMessage }) });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-array-delete"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket, seed);
        await room.__experimental_storage({ senderId: socket.id }).deleteMessage({});
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.procedure)).toEqual([null, "deleteMessage"]);
        expect(changes.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
        ]);
        expect(messagesFrom(changes.map((change) => change.update))).toEqual([]);
    });

    it("emits a text delete with its actor", async () => {
        const batches: Edit[][] = [];
        const textStorage = yjs.schema({ content: yjs.yText() });
        const seed = incremental((doc) => {
            doc.getText("content").insert(0, "hi");
        });
        const local = createTreaty({ user: testAuthorizeUser, presence, storage: textStorage });
        const deleteCharacter = local.procedure.storage
            .input(z.object({}))
            .resolve((_input, { storage: docStorage }) => {
                docStorage.content.delete(0, 1);
            });
        const io = createAuthorizedIO({ treaty: local.router({ deleteCharacter }) });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-text-delete"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket, seed);
        await room.__experimental_storage({ senderId: socket.id }).deleteCharacter({});
        await waitForStorageSnapshot();

        const changes = batches.flat();
        const doc = new YDoc();

        for (const change of changes) {
            applyUpdate(doc, Buffer.from(change.update, "base64"));
        }

        expect(changes.map((change) => change.procedure)).toEqual([null, "deleteCharacter"]);
        expect(changes.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
        ]);
        expect(doc.getText("content").toString()).toBe("i");
        doc.destroy();
    });

    it("drops a reservation from a room that was torn down", async () => {
        const batches: Edit[][] = [];
        const { first, second } = pair();
        let destroyed = false;
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onRoomDestroyed: () => {
                destroyed = true;
            },
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-generation"));
        const socket = new TestSocket("session-1");
        const next = new TestSocket("session-2");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", { origin: null, update: second });
        await room.evictAll();

        expect(destroyed).toBe(true);
        expect(batches.flat()).toEqual([]);

        await registerAuthorized(room, next, { io });
        await initialize(room, next);
        await send(room, next, "$updateStorage", { origin: null, update: first });
        await waitForStorageSnapshot();

        expect(messagesFrom(batches.flat().map((change) => change.update))).toEqual(["first"]);
    });
});

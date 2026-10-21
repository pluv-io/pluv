import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { manageSessions } from "@pluv/io";
import { createTreaty } from "@pluv/treaty";
import { applyUpdate, Doc as YDoc } from "yjs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    deferred,
    registerAuthorized,
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

const messagesFrom = (updates: readonly string[], encodedState?: string): string[] => {
    const doc = new YDoc();

    if (encodedState) applyUpdate(doc, Buffer.from(encodedState, "base64"));

    for (const update of updates) {
        applyUpdate(doc, Buffer.from(update, "base64"));
    }

    const messages = doc.getArray("messages").toJSON() as string[];

    doc.destroy();

    return messages;
};

const send = async (
    room: { onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void> },
    socket: TestSocket,
    type: string,
    data: unknown,
): Promise<void> => {
    await room.onMessage(socket)({ data: JSON.stringify({ type, data }) });
};

describe("IORoom storage edits", () => {
    it("batches ordered edits and replaying them reproduces the document", async () => {
        const batches: Edit[][] = [];
        const initialDoc = storage.getInitialized({ messages: ["base"] });
        const initial = initialDoc.getEncodedState();

        initialDoc.destroy();

        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => initial,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
            router: io.router({
                note: io.procedure.broadcast((_input, { doc }) => {
                    doc.get("messages").push(["note"]);

                    return {};
                }),
                raw: io.procedure.broadcast((_input, { doc }) => {
                    (doc as { value: YDoc }).value.getArray("messages").push(["raw"]);

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom("storage-edits"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await send(room, socket, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });
        await room.__experimental_storage({ senderId: socket.id }).addMessage({ text: "hello" });
        await send(room, socket, "note", {});
        await send(room, socket, "raw", {});
        await waitForStorageSnapshot();

        expect(batches).toHaveLength(1);
        expect(batches[0]?.map((change) => change.procedure)).toEqual(["addMessage", null, null]);
        expect(batches[0]?.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
            null,
        ]);
        expect(batches[0]?.map((change) => change.operator)).toEqual([null, null, null]);
        expect(messagesFrom(batches[0]?.map((change) => change.update) ?? [], initial)).toEqual([
            "base",
            "hello",
            "note",
            "raw",
        ]);
    });

    it("keeps the caller on a write after await, including two overlapping calls", async () => {
        const batches: Edit[][] = [];
        const started = { first: deferred(), second: deferred() };
        const gates = { first: deferred(), second: deferred() };
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
            router: io.router({
                write: io.procedure.broadcast(async (_input, { doc, user }) => {
                    if (user.id === "session-1") {
                        started.first.resolve();
                        await gates.first.promise;
                    } else {
                        started.second.resolve();
                        await gates.second.promise;
                    }

                    doc.get("messages").push([user.id]);

                    return {};
                }),
            }),
        });
        const room = manageSessions(server.createRoom("storage-edit-callers"));
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await registerAuthorized(room, second, { io });
        await send(room, first, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });
        await send(room, second, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });

        const firstWrite = send(room, first, "write", {});

        await started.first.promise;

        const secondWrite = send(room, second, "write", {});

        await started.second.promise;
        gates.first.resolve();
        await tick();
        gates.second.resolve();
        await firstWrite;
        await secondWrite;
        await waitForStorageSnapshot();

        expect(batches).toHaveLength(1);
        expect(batches[0]?.map((change) => change.procedure)).toEqual([null, null]);
        expect(batches[0]?.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-2" },
        ]);
        expect(messagesFrom(batches[0]?.map((change) => change.update) ?? [])).toEqual([
            "session-1",
            "session-2",
        ]);
    });

    it("flushes waiting edits when the room is destroyed", async () => {
        const batches: Edit[][] = [];
        const seedDoc = storage.getInitialized({ messages: ["seed"] });
        const update = seedDoc.getEncodedState();

        seedDoc.destroy();

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

        const started = Date.now();

        await send(room, socket, "$initializeSession", {
            presence: { selectionId: null },
            update,
        });
        await room.__experimental_storage({ senderId: socket.id }).addMessage({ text: "hello" });

        expect(batches).toEqual([]);

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
});

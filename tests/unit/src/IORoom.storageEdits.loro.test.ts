import { manageSessions } from "@pluv/io";
import { loro } from "@pluv/crdt-loro";
import { createTreaty } from "@pluv/treaty";
import { LoroDoc } from "loro-crdt";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    registerAuthorized,
    TestSocket,
    testAuthorizeUser,
    waitForStorageSnapshot,
} from "./__utils__";

const presence = z.object({
    selectionId: z.string().nullable(),
});
const storage = loro.schema({
    content: loro.loroText(),
});
const t = createTreaty({
    user: testAuthorizeUser,
    presence,
    storage,
});
const deleteCharacter = t.procedure.storage
    .input(z.object({}))
    .resolve((_input, { storage: docStorage }) => {
        docStorage.content.delete(0, 1);
    });
const treaty = t.router({ deleteCharacter });

type Edit = {
    procedure: string | null;
    update: string;
    user: { id: string } | null;
};

const textFrom = (updates: readonly string[]): string => {
    const doc = new LoroDoc();

    try {
        for (const update of updates) {
            doc.import(Buffer.from(update, "base64"));
        }

        return doc.getText("content").toString();
    } finally {
        doc.free();
    }
};

const incremental = (write: (doc: LoroDoc) => void): string => {
    const doc = new LoroDoc();
    const before = doc.oplogVersion();

    try {
        write(doc);
        doc.commit();

        return Buffer.from(doc.export({ mode: "update", from: before })).toString("base64");
    } finally {
        before.free();
        doc.free();
    }
};

const pair = (): { first: string; second: string } => {
    const doc = new LoroDoc();
    const beforeFirst = doc.oplogVersion();

    doc.getText("content").insert(0, "first");
    doc.commit();

    const first = Buffer.from(doc.export({ mode: "update", from: beforeFirst })).toString("base64");
    const beforeSecond = doc.oplogVersion();

    doc.getText("content").insert(5, " second");
    doc.commit();

    const second = Buffer.from(doc.export({ mode: "update", from: beforeSecond })).toString(
        "base64",
    );

    beforeFirst.free();
    beforeSecond.free();
    doc.free();

    return { first, second };
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

describe("IORoom storage edits for Loro", () => {
    it("emits a text delete with its actor", async () => {
        const batches: Edit[][] = [];
        const seed = incremental((doc) => {
            doc.getText("content").insert(0, "hi");
        });
        const io = createAuthorizedIO({ treaty });
        const server = io.server({
            getInitialStorage: () => null,
            onStorageEdits: (event) => {
                batches.push([...event.changes]);
            },
        });
        const room = manageSessions(server.createRoom("storage-edits-loro-delete"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket, seed);
        await room.__experimental_storage({ senderId: socket.id }).deleteCharacter({});
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.procedure)).toEqual([null, "deleteCharacter"]);
        expect(changes.map((change) => change.user)).toEqual([
            { id: "session-1" },
            { id: "session-1" },
        ]);
        expect(textFrom(changes.map((change) => change.update))).toBe("i");
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
        const room = manageSessions(server.createRoom("storage-edits-loro-order"));
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initialize(room, socket);
        await send(room, socket, "$updateStorage", { origin: null, update: second });
        await send(room, socket, "$updateStorage", {
            origin: null,
            procedure: "addMessage",
            update: first,
        });
        await waitForStorageSnapshot();

        const changes = batches.flat();

        expect(changes.map((change) => change.procedure)).toEqual(["addMessage", null]);
        expect(textFrom(changes.map((change) => change.update))).toBe("first second");
    });
});

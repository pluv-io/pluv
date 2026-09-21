import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAuthorizedIO, registerAuthorized, TestSocket, testAuthorizeUser } from "./__utils__";

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
const treaty = t.router({ select, addMessage });

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    __experimental_presence: {
        select: (input: { id: string | null }, senderId: string) => Promise<void>;
    };
    __experimental_storage: {
        addMessage: (input: { text: string }, senderId: string) => Promise<void>;
    };
};

const lastMessage = (socket: TestSocket, type: string): Record<string, any> => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const initializeSession = async (
    room: Room,
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
            platform: { mode: "detached" },
            treaty,
        });
        const server = io.server({
            getInitialStorage: () => null,
        });
        const room = server.createRoom(roomId);

        return { io, room };
    };

    it("requires a live senderId for presence and storage", async () => {
        const { room } = createRoom();

        await expect(
            room.__experimental_presence.select({ id: "item" }, undefined as never),
        ).rejects.toThrow(/senderId/);
        await expect(
            room.__experimental_storage.addMessage({ text: "hello" }, "missing"),
        ).rejects.toThrow(/Unknown senderId/);
    });

    it("applies presence through $updatePresence limits and $presenceUpdated", async () => {
        const { io, room } = createRoom();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });
        await registerAuthorized(room, second, { io });
        await initializeSession(room, second, { selectionId: null });

        await room.__experimental_presence.select({ id: "item-1" }, first.id);

        expect(lastMessage(second, "$presenceUpdated").data.presence).toEqual({
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

        await room.__experimental_storage.addMessage({ text: "hello" }, first.id);

        const encodedState = lastMessage(second, "$storageUpdated").data.state;
        const doc = storage.getEmpty().applyEncodedState({ update: encodedState });

        expect(doc.toJson()).toEqual({ messages: ["hello"] });
    });
});

import { manageSessions } from "@pluv/io";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedIO,
    registerAuthorized,
    TestPersistence,
    TestSocket,
    testAuthorizeUser,
    waitForStorageCheckpoint,
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

        const presence = room.__experimental_presence({ senderId: first.id });

        await expect(Promise.resolve(presence)).resolves.toBe(presence);

        const storage = room.__experimental_storage({ senderId: first.id });

        await expect((async () => storage)()).resolves.toBe(storage);
        expect(typeof storage.addMessage).toBe("function");
    });

    it("keeps the senderId from bind time when the actor object is mutated", async () => {
        const { io, room } = createRoom("treaty-bind-sender");
        const first = new TestSocket("session-1");

        await registerAuthorized(room, first, { io });
        await initializeSession(room, first, { selectionId: null });

        const actor = { senderId: first.id };
        const storage = room.__experimental_storage(actor);

        actor.senderId = "missing";

        await storage.addMessage({ text: "hello" });

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
        await waitForStorageCheckpoint();

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

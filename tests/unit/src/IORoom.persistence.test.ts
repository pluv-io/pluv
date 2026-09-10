import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate, encodeStateVector } from "yjs";
import { describe, expect, it } from "vitest";
import { encodedStateWithContent, TestPersistence, TestPlatform, TestSocket } from "./__utils__";

const ROOM_ID = "repeated-persistence";

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

        const io = createIO({
            crdt: yjs,
            platform: () => new TestPlatform({ mode: "detached" }),
        });
        const server = io.server({
            getInitialStorage: () => Promise.resolve(externalStorage),
            onStorageDestroyed: ({ encodedState }) => {
                if (encodedState) externalStorage = encodedState;
            },
        });

        const firstRoom = server.createRoom(ROOM_ID);
        const firstSocket = new TestSocket("session-1");

        await firstRoom.register(firstSocket);
        await updateStorage(
            firstRoom,
            firstSocket,
            appendUpdate(getRegisteredState(firstSocket), " first"),
        );
        await firstRoom.evictAll();

        expect(decodeText(externalStorage)).toBe("initial first");

        const secondRoom = server.createRoom(ROOM_ID);
        const secondSocket = new TestSocket("session-2");

        await secondRoom.register(secondSocket);
        await updateStorage(
            secondRoom,
            secondSocket,
            appendUpdate(getRegisteredState(secondSocket), " second"),
        );
        await secondRoom.evictAll();

        expect(decodeText(externalStorage)).toBe("initial first second");

        const thirdRoom = server.createRoom(ROOM_ID);
        const thirdSocket = new TestSocket("session-3");

        await thirdRoom.register(thirdSocket);

        expect(decodeText(getRegisteredState(thirdSocket))).toBe("initial first second");
    });

    it("preserves newer Durable Object storage across hibernation and reload", async () => {
        let externalStorage = encodedStateWithContent("initial");
        let hibernatedSockets: readonly TestSocket[] = [];
        let initialStorageReads = 0;
        const persistence = new TestPersistence();

        const io = createIO({
            crdt: yjs,
            platform: () =>
                new TestPlatform({
                    hibernatedWebSockets: hibernatedSockets,
                    mode: "detached",
                    persistence,
                    serializedStates: new Map(
                        hibernatedSockets.map((socket) => [
                            socket,
                            {
                                presence: null,
                                quit: false,
                                room: ROOM_ID,
                                timers: { ping: Date.now(), presence: null },
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

        const firstRoom = server.createRoom(ROOM_ID);
        const firstSocket = new TestSocket("session-1");

        await firstRoom.register(firstSocket);
        await updateStorage(
            firstRoom,
            firstSocket,
            appendUpdate(getRegisteredState(firstSocket), " first"),
        );

        hibernatedSockets = [firstSocket];

        const firstWake = server.createRoom(ROOM_ID);

        await firstWake.onClose(firstSocket)({ code: 1_000, reason: "reload" });
        expect(initialStorageReads).toBe(1);

        const secondSocket = new TestSocket("session-2");

        await firstWake.register(secondSocket);
        expect(decodeText(getRegisteredState(secondSocket))).toBe("initial first");
        expect(initialStorageReads).toBe(2);

        await updateStorage(
            firstWake,
            secondSocket,
            appendUpdate(getRegisteredState(secondSocket), " second"),
        );

        hibernatedSockets = [secondSocket];

        const secondWake = server.createRoom(ROOM_ID);

        await secondWake.onClose(secondSocket)({ code: 1_000, reason: "reload" });
        expect(initialStorageReads).toBe(2);

        const thirdSocket = new TestSocket("session-3");

        await secondWake.register(thirdSocket);

        expect(decodeText(getRegisteredState(thirdSocket))).toBe("initial first second");
        expect(decodeText(externalStorage)).toBe("initial first second");
        expect(initialStorageReads).toBe(3);
    });
});

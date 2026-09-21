import { MockedRoom, PluvRoom } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { StorageState } from "@pluv/types";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const user = z.object({ id: z.string() });
const presence = z.object({ selectionId: z.string().nullable() });
const storage = yjs.schema({
    messages: yjs.yArray(s.string()),
});

const t = createTreaty({ user, presence, storage });
const select = t.procedure.presence
    .input(z.object({ id: z.string().nullable() }))
    .resolve(({ id }) => ({ selectionId: id }));
const addMessage = t.procedure.storage
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { storage: docStorage }) => {
        docStorage.messages.push([text]);
    });
const rawPush = t.procedure.storage.input(z.object({ text: z.string() })).resolve(
    ({ text }, { storage: docStorage }) => {
        docStorage.messages.push([text]);
    },
    { transact: false },
);
const treaty = t.router({ select, addMessage, rawPush });

type TestDefs = {
    io: any;
    treaty: typeof treaty;
    presence: typeof treaty.presence;
    metadata: undefined;
    storage: typeof treaty.storage;
    events: {};
};

const seedMyself = (room: MockedRoom<TestDefs>): void => {
    (
        room as unknown as { _usersManager: { setMyself: (params: any) => void } }
    )._usersManager.setMyself({
        connectionId: "mocked",
        data: { id: "ada" },
        presence: { selectionId: null },
    });
};

describe("PluvRoom treaty invoke", () => {
    it("throws when presence is invoked before the local user exists", async () => {
        const room = new PluvRoom<TestDefs>("client-presence", {
            authEndpoint: () => "",
            limits: {},
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });

        await expect(room.presence.select({ id: "item" })).rejects.toThrow(
            /local user is available/,
        );
        await expect(
            (room.presence as (name: string, data: unknown) => Promise<void>)("missing", {
                id: null,
            }),
        ).rejects.toThrow('Unknown presence procedure "missing"');
    });

    it("throws when storage is invoked before storage is loaded", () => {
        const room = new PluvRoom<TestDefs>("client-storage", {
            authEndpoint: () => "",
            limits: {},
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });

        expect(() => room.storage.addMessage({ text: "hello" })).toThrow(/storage is loaded/);
        expect(room.getStorage("messages")).toBeNull();
    });

    it("throws when storage is invoked after register and before storage sync", () => {
        const room = new PluvRoom<TestDefs>("client-storage-loading", {
            authEndpoint: () => "",
            limits: {},
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });
        const internals = room as unknown as {
            _state: {
                connection: { id: string | null };
                storage: { state: string };
            };
            _usersManager: { setMyself: (params: any) => void };
        };

        internals._state.connection.id = "conn-1";
        internals._state.storage.state = StorageState.Loading;
        internals._usersManager.setMyself({
            connectionId: "conn-1",
            data: { id: "ada" },
            presence: { selectionId: null },
        });

        expect(room.getStorage("messages")).toBeNull();
        expect(() => room.storage.addMessage({ text: "hello" })).toThrow(/storage is loaded/);
        expect(room.getDoc().toJson().messages).not.toEqual(["hello"]);
    });

    it("throws when storage is loaded but there is no connection id", () => {
        const room = new PluvRoom<TestDefs>("client-storage-offline", {
            authEndpoint: () => "",
            limits: {},
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });
        const internals = room as unknown as {
            _state: {
                connection: { id: string | null };
                storage: { state: string };
            };
            _usersManager: { setMyself: (params: any) => void };
        };

        internals._state.storage.state = StorageState.Offline;
        internals._usersManager.setMyself({
            connectionId: "conn-1",
            data: { id: "ada" },
            presence: { selectionId: null },
        });

        expect(() => room.storage.addMessage({ text: "hello" })).toThrow(/connection id/);
    });
});

describe("MockedRoom treaty invoke", () => {
    const createRoom = () => {
        const room = new MockedRoom<TestDefs>("mocked", {
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
        });

        room.getDoc().rebuildStorage();

        return room;
    };

    it("applies presence procedures through updateMyPresence", async () => {
        const room = createRoom();

        seedMyself(room);
        await room.presence.select({ id: "item-1" });

        expect(room.getMyPresence()).toEqual({ selectionId: "item-1" });
    });

    it("throws on invalid presence input", async () => {
        const room = createRoom();

        seedMyself(room);

        await expect(room.presence.select({ id: 1 as never })).rejects.toThrow();
    });

    it("mutates storage inside transact unless opted out", () => {
        const room = createRoom();

        seedMyself(room);

        const transact = vi.spyOn(room, "transact");

        room.storage.addMessage({ text: "hello" });

        expect(transact).toHaveBeenCalled();
        expect(room.getDoc().toJson().messages).toEqual(["hello"]);
        expect(room.canUndo()).toBe(true);

        transact.mockClear();
        room.undo();
        room.storage.rawPush({ text: "raw" });

        expect(transact).not.toHaveBeenCalled();
        expect(room.getDoc().toJson().messages).toEqual(["raw"]);
    });

    it("throws on unknown storage procedure names", () => {
        const room = createRoom();

        seedMyself(room);

        expect(() =>
            (room.storage as (name: string, data: unknown) => void)("missing", { text: "x" }),
        ).toThrow('Unknown storage procedure "missing"');
    });
});

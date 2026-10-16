import { MockedRoom, PluvRoom } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { StorageState } from "@pluv/types";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { deferred, tick } from "./__utils__";

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
        kind: "user",
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
            kind: "user",
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
            kind: "user",
            presence: { selectionId: null },
        });

        expect(() => room.storage.addMessage({ text: "hello" })).toThrow(/connection id/);
    });

    it("waits for an async presence resolver before applying the patch", async () => {
        const gate = deferred<void>();
        const local = createTreaty({ user, presence, storage });
        const select = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(async ({ id }) => {
                await gate.promise;

                return { selectionId: id };
            });
        const asyncTreaty = local.router({ select });
        const room = new PluvRoom("client-async-presence", {
            authEndpoint: () => "",
            limits: {},
            presence: asyncTreaty.presence,
            storage: asyncTreaty.storage,
            treaty: asyncTreaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });

        (
            room as unknown as { _usersManager: { setMyself: (params: any) => void } }
        )._usersManager.setMyself({
            connectionId: "conn-1",
            data: { id: "ada" },
            kind: "user",
            presence: { selectionId: null },
        });

        const pending = room.presence.select({ id: "item-1" });

        await tick();

        expect(room.getMyPresence()).toEqual({ selectionId: null });

        gate.resolve();
        await pending;

        expect(room.getMyPresence()).toEqual({ selectionId: "item-1" });
    });

    it("drops an older async presence patch when a newer call finishes first", async () => {
        const firstGate = deferred<void>();
        const secondGate = deferred<void>();
        let calls = 0;
        const local = createTreaty({ user, presence, storage });
        const select = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(async ({ id }) => {
                calls += 1;
                await (calls === 1 ? firstGate.promise : secondGate.promise);

                return { selectionId: id };
            });
        const asyncTreaty = local.router({ select });
        const room = new PluvRoom("client-async-presence-order", {
            authEndpoint: () => "",
            limits: {},
            presence: asyncTreaty.presence,
            storage: asyncTreaty.storage,
            treaty: asyncTreaty,
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
        });

        (
            room as unknown as { _usersManager: { setMyself: (params: any) => void } }
        )._usersManager.setMyself({
            connectionId: "conn-1",
            data: { id: "ada" },
            kind: "user",
            presence: { selectionId: null },
        });

        const first = room.presence.select({ id: "old" });
        const second = room.presence.select({ id: "new" });

        await tick();
        secondGate.resolve();
        await second;

        expect(room.getMyPresence()).toEqual({ selectionId: "new" });

        firstGate.resolve();
        await first;

        expect(room.getMyPresence()).toEqual({ selectionId: "new" });
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

    it("can enter as an operator and keep occupant-only defaults", async () => {
        const operator = {
            id: "staff-1",
            name: "Ada",
            imageUrl: null,
        };
        const room = new MockedRoom<TestDefs>("mocked-operator", {
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
            myself: {
                data: { id: "owner:staff-1" },
                kind: "operator",
                operator,
            },
            presence: treaty.presence,
            storage: treaty.storage,
            treaty,
        });
        const internals = room as unknown as {
            _usersManager: { addConnection: (params: any) => void };
        };

        internals._usersManager.addConnection({
            connectionId: "ada-tab",
            data: { id: "ada" },
            kind: "user",
            presence: { selectionId: null },
        });

        expect(room.getMyself()).toEqual({
            data: { id: "owner:staff-1" },
            kind: "operator",
            operator: { id: "staff-1", name: "Ada", imageUrl: null },
            presence: { selectionId: null },
        });
        expect(room.getOthers()).toHaveLength(1);
        expect(room.getOthers({ kinds: ["operator"] })).toHaveLength(0);
        expect(room.getRoomStats()).toEqual({ connectionCount: 1, userCount: 1 });
        expect(room.getRoomStats({ kinds: ["operator"] })).toEqual({
            connectionCount: 1,
            userCount: 1,
        });
        expect(room.getRoomStats({ kinds: ["user", "operator"] })).toEqual({
            connectionCount: 2,
            userCount: 2,
        });
        await expect(room.listUsers()).resolves.toMatchObject({
            success: true,
            users: [{ data: { id: "ada" } }],
        });

        await room.presence.select({ id: "item" });

        expect(room.getMyPresence()).toEqual({ selectionId: "item" });
    });

    it("waits for an async presence resolver before applying the patch", async () => {
        const gate = deferred<void>();
        const local = createTreaty({ user, presence, storage });
        const select = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(async ({ id }) => {
                await gate.promise;

                return { selectionId: id };
            });
        const asyncTreaty = local.router({ select });
        const room = new MockedRoom("mocked-async-presence", {
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
            myself: { data: { id: "ada" } },
            presence: asyncTreaty.presence,
            storage: asyncTreaty.storage,
            treaty: asyncTreaty,
        });
        const pending = room.presence.select({ id: "item-1" });

        await tick();

        expect(room.getMyPresence()).toEqual({ selectionId: null });

        gate.resolve();
        await pending;

        expect(room.getMyPresence()).toEqual({ selectionId: "item-1" });
    });

    it("drops an older async presence patch when a newer call finishes first", async () => {
        const firstGate = deferred<void>();
        const secondGate = deferred<void>();
        let calls = 0;
        const local = createTreaty({ user, presence, storage });
        const select = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(async ({ id }) => {
                calls += 1;
                await (calls === 1 ? firstGate.promise : secondGate.promise);

                return { selectionId: id };
            });
        const asyncTreaty = local.router({ select });
        const room = new MockedRoom("mocked-async-presence-order", {
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
            myself: { data: { id: "ada" } },
            presence: asyncTreaty.presence,
            storage: asyncTreaty.storage,
            treaty: asyncTreaty,
        });
        const first = room.presence.select({ id: "old" });
        const second = room.presence.select({ id: "new" });

        await tick();
        secondGate.resolve();
        await second;

        expect(room.getMyPresence()).toEqual({ selectionId: "new" });

        firstGate.resolve();
        await first;

        expect(room.getMyPresence()).toEqual({ selectionId: "new" });
    });

    it("rejects when an async presence resolver rejects", async () => {
        const local = createTreaty({ user, presence, storage });
        const select = local.procedure.presence
            .input(z.object({ id: z.string().nullable() }))
            .resolve(async () => {
                throw new Error("presence failed");
            });
        const asyncTreaty = local.router({ select });
        const room = new MockedRoom("mocked-async-presence-fail", {
            initialPresence: { selectionId: null },
            initialStorage: { messages: [] },
            myself: { data: { id: "ada" } },
            presence: asyncTreaty.presence,
            storage: asyncTreaty.storage,
            treaty: asyncTreaty,
        });

        await expect(room.presence.select({ id: "item-1" })).rejects.toThrow("presence failed");
        expect(room.getMyPresence()).toEqual({ selectionId: null });
    });
});

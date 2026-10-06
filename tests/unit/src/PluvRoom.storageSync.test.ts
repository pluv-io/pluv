import { PluvRoom } from "@pluv/client";
import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { loro } from "@pluv/crdt-loro";
import { yjs } from "@pluv/crdt-yjs";
import { createTreaty } from "@pluv/treaty";
import { describe, expect, it } from "vitest";
import { z } from "zod";

type SyncDoc = {
    applyEncodedState(params: { update: string }): SyncDoc;
    captureUpdate(fn: () => void): string | null;
    destroy(): void;
    encodeDiff(stateVector: string): string;
    get(key: "content"): { insert(index: number, text: string): void; toString(): string };
    getEncodedState(): string;
    getStateVector(): string;
    hasPending(): boolean;
    isEmpty(): boolean;
    transact(fn: () => void): unknown;
};

type SyncStorage = AbstractCrdtDocFactory<any, any, any, any>;

type Sent = { type: string; data: unknown };

const flush = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

const syncCount = (sent: Sent[]): number => {
    return sent.filter((message) => message.type === "$syncStorage").length;
};

const createRoom = (storage: SyncStorage) => {
    const sent: Sent[] = [];
    const treaty = createTreaty({
        user: z.object({ id: z.string() }),
        presence: z.object({}),
        storage,
    }).router({});
    const room = new PluvRoom("storage-sync", {
        authEndpoint: () => "",
        limits: {},
        presence: treaty.presence,
        storage: treaty.storage,
        treaty,
        initialPresence: {},
        initialStorage: { content: "" },
    });
    const internal = room as unknown as {
        _crdtManager: { doc: SyncDoc };
        _onMessage: (event: { data: string }) => void;
        _state: { webSocket: { readyState: number; send: (data: string) => void } | null };
    };

    internal._state.webSocket = {
        readyState: WebSocket.OPEN,
        send(data: string) {
            sent.push(JSON.parse(data) as Sent);
        },
    };

    const deliver = (type: string, data: unknown, connectionId: string | null = "session-1") => {
        internal._onMessage({
            data: JSON.stringify({
                type,
                data,
                ...(connectionId === null ? {} : { connectionId }),
            }),
        });
    };

    return { deliver, internal, room, sent };
};

const history = (storage: SyncStorage) => {
    const source = storage.getInitialized() as SyncDoc;

    source.transact(() => {
        source.get("content").insert(0, "hello");
    });

    const earlier = source.getEncodedState();
    const later = source.captureUpdate(() => {
        source.get("content").insert(5, " world");
    });

    source.destroy();

    if (!later) throw new Error("Expected a later update");

    return { earlier, later };
};

/**
 * @description What `encodeDiff` returns once the server already has the caller's integrated
 * state. Yjs and Loro both send a small header here, not an empty string.
 */
const nothingNew = (storage: SyncStorage, doc: SyncDoc): string => {
    const integrated = doc.getEncodedState();
    const server = storage.getEmpty() as SyncDoc;

    if (integrated) server.applyEncodedState({ update: integrated });

    try {
        return server.encodeDiff(doc.getStateVector());
    } finally {
        server.destroy();
    }
};

const scenarios = [
    { name: "yjs", storage: yjs.schema({ content: yjs.yText() }) },
    { name: "loro", storage: loro.schema({ content: loro.loroText() }) },
];

describe.each(scenarios)("PluvRoom storage sync ($name)", ({ storage }) => {
    it("holds a live diff until the initial storage arrives", async () => {
        const { deliver, internal, room } = createRoom(storage);
        const { earlier, later } = history(storage);

        deliver("$storageUpdated", { state: later });

        expect(internal._crdtManager.doc.isEmpty()).toBe(true);
        expect(room.getStorage("content")).toBeNull();

        deliver("$storageReceived", { changeKind: "unchanged", state: earlier });
        await flush();

        expect(room.getStorage("content")?.toString()).toBe("hello world");
        expect(internal._crdtManager.doc.hasPending()).toBe(false);
    });

    it("requests the missing changes and applies them", async () => {
        const { deliver, internal, room, sent } = createRoom(storage);
        const { earlier, later } = history(storage);

        deliver("$storageReceived", { changeKind: "unchanged", state: later });
        await flush();

        expect(internal._crdtManager.doc.hasPending()).toBe(true);
        expect(syncCount(sent)).toBe(1);

        deliver("$storageDiff", { update: earlier });

        expect(room.getStorage("content")?.toString()).toBe("hello world");
        expect(internal._crdtManager.doc.hasPending()).toBe(false);
        expect(syncCount(sent)).toBe(1);
    });

    it("stops asking after empty diffs and starts again when another update arrives", async () => {
        const { deliver, internal, sent } = createRoom(storage);
        const { later } = history(storage);

        deliver("$storageReceived", { changeKind: "unchanged", state: later });
        await flush();

        for (let attempt = 0; attempt < 20; attempt += 1) {
            deliver("$storageDiff", { update: "" });
        }

        expect(internal._crdtManager.doc.hasPending()).toBe(true);
        expect(syncCount(sent)).toBe(8);

        deliver("$storageUpdated", { state: later });

        expect(syncCount(sent)).toBe(9);
        expect(internal._crdtManager.doc.hasPending()).toBe(true);
    });

    it("stops asking when a caught-up diff adds nothing", async () => {
        const { deliver, internal, sent } = createRoom(storage);
        const { later } = history(storage);

        deliver("$storageReceived", { changeKind: "unchanged", state: later });
        await flush();

        const update = nothingNew(storage, internal._crdtManager.doc);

        expect(update).not.toBe("");

        for (let attempt = 0; attempt < 20; attempt += 1) {
            deliver("$storageDiff", { update });
        }

        expect(internal._crdtManager.doc.hasPending()).toBe(true);
        expect(syncCount(sent)).toBe(8);
    });

    it("ignores a storage diff that has no connection id", async () => {
        const { deliver, internal, sent } = createRoom(storage);
        const { earlier, later } = history(storage);

        deliver("$storageReceived", { changeKind: "unchanged", state: later });
        await flush();

        deliver("$storageDiff", { update: earlier }, null);

        expect(internal._crdtManager.doc.hasPending()).toBe(true);
        expect(syncCount(sent)).toBe(1);
    });
});

import { loro } from "@pluv/crdt-loro";
import { yjs } from "@pluv/crdt-yjs";
import { LoroDoc } from "loro-crdt";
import { applyUpdate, Doc as YDoc, encodeStateAsUpdate, encodeStateVector } from "yjs";
import { describe, expect, it } from "vitest";
import {
    createAuthorizedIO,
    deferred,
    encodedLoroStateWithContent,
    encodedStateWithContent,
    registerAuthorized,
    TestPersistence,
    TestSocket,
    tick,
} from "./__utils__";

type Room = {
    onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void>;
    register: (socket: TestSocket) => Promise<void>;
};

const appendYjs = (encodedState: string, text: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));

    const stateVector = encodeStateVector(doc);
    const content = doc.getText("content");

    content.insert(content.length, text);

    return Buffer.from(encodeStateAsUpdate(doc, stateVector)).toString("base64");
};

const appendLoro = (encodedState: string, text: string): string => {
    const doc = new LoroDoc();

    doc.import(Buffer.from(encodedState, "base64"));

    const content = doc.getText("content");

    content.insert(content.length, text);
    doc.commit();

    return Buffer.from(doc.export({ mode: "update" })).toString("base64");
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = [...socket.messages].reverse().find((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const initializeSession = async (room: Room, socket: TestSocket, update: string): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$initializeSession",
            data: { presence: {}, update },
        }),
    });
};

const updateStorage = async (
    room: Room,
    socket: TestSocket,
    origin: string | null,
    update: string,
): Promise<void> => {
    await room.onMessage(socket)({
        data: JSON.stringify({
            type: "$updateStorage",
            data: { origin, update },
        }),
    });
};

class GatedPersistence extends TestPersistence {
    public readonly persist = deferred<void>();

    public override setStorageState(room: string, state: string): Promise<void> {
        return this.persist.promise.then(() => super.setStorageState(room, state));
    }
}

const scenarios = [
    {
        name: "yjs",
        crdt: yjs,
        encode: encodedStateWithContent,
        decode: (encodedState: string) => {
            const doc = yjs
                .doc(() => ({}))
                .getEmpty()
                .applyEncodedState({ update: encodedState });
            const content = (doc.toJson() as { content?: string }).content ?? "";

            doc.destroy();

            return content;
        },
        append: appendYjs,
    },
    {
        name: "loro",
        crdt: loro,
        encode: encodedLoroStateWithContent,
        decode: (encodedState: string) => {
            const doc = loro
                .doc(() => ({}))
                .getEmpty()
                .applyEncodedState({ update: encodedState });
            const content = (doc.toJson() as { content?: string }).content ?? "";

            doc.destroy();

            return content;
        },
        append: appendLoro,
    },
];

describe.each(scenarios)("$name IORoom storage init", ({ append, crdt, decode, encode }) => {
    const createRoom = (config: {
        getInitialStorage: () => Promise<string | null>;
        persistence?: TestPersistence;
        roomId?: string;
    }) => {
        const persistence = config.persistence ?? new TestPersistence();
        const io = createAuthorizedIO({
            crdt,
            platform: { mode: "detached", persistence },
        });
        const server = io.server({ getInitialStorage: config.getInitialStorage });
        const room = server.createRoom(config.roomId ?? "storage-init");

        return { io, persistence, room };
    };

    it("keeps delayed webhook state instead of a later client seed", async () => {
        const webhook = deferred<string | null>();
        let reads = 0;
        const { io, room } = createRoom({
            getInitialStorage: () => {
                reads += 1;

                return webhook.promise;
            },
        });
        const socket = new TestSocket("session-1");
        const registration = registerAuthorized(room, socket, { io });

        await tick();
        expect(reads).toBe(1);

        webhook.resolve(encode("server"));
        await registration;
        await initializeSession(room, socket, encode("client"));

        expect(decode(lastMessage(socket, "$storageReceived").data.state)).toBe("server");
        expect(lastMessage(socket, "$storageReceived").data.changeKind).toBe("unchanged");
        expect(reads).toBe(1);
    });

    it("lets persistence beat a delayed webhook and client seed", async () => {
        const persistence = new TestPersistence();
        const webhook = deferred<string | null>();
        let reads = 0;

        await persistence.setStorageState("storage-init", encode("do"));

        const { io, room } = createRoom({
            getInitialStorage: () => {
                reads += 1;

                return webhook.promise;
            },
            persistence,
        });
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        expect(reads).toBe(0);

        webhook.resolve(encode("webhook"));
        await initializeSession(room, socket, encode("client"));

        expect(decode(lastMessage(socket, "$storageReceived").data.state)).toBe("do");
        expect(reads).toBe(0);
    });

    it("allows a client seed when the delayed webhook is null", async () => {
        const webhook = deferred<string | null>();
        const { io, persistence, room } = createRoom({
            getInitialStorage: () => webhook.promise,
        });
        const socket = new TestSocket("session-1");
        const registration = registerAuthorized(room, socket, { io });

        await tick();
        webhook.resolve(null);
        await registration;
        await initializeSession(room, socket, encode("client"));

        expect(lastMessage(socket, "$storageReceived").data.changeKind).toBe("initialized");
        expect(decode(lastMessage(socket, "$storageReceived").data.state)).toBe("client");
        expect(decode((await persistence.getStorageState("storage-init")) ?? "")).toBe("client");
    });

    it("hydrates two overlapping first connections from one webhook fetch", async () => {
        const webhook = deferred<string | null>();
        let reads = 0;
        const { io, room } = createRoom({
            getInitialStorage: () => {
                reads += 1;

                return webhook.promise;
            },
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const registrations = Promise.all([
            registerAuthorized(room, first, { io }),
            registerAuthorized(room, second, { io }),
        ]);

        await tick();
        expect(reads).toBe(1);

        webhook.resolve(encode("server"));
        await registrations;
        await Promise.all([
            initializeSession(room, first, encode("client-a")),
            initializeSession(room, second, encode("client-b")),
        ]);

        expect(decode(lastMessage(first, "$storageReceived").data.state)).toBe("server");
        expect(decode(lastMessage(second, "$storageReceived").data.state)).toBe("server");
        expect(lastMessage(first, "$storageReceived").data.changeKind).toBe("unchanged");
        expect(lastMessage(second, "$storageReceived").data.changeKind).toBe("unchanged");
        expect(reads).toBe(1);
    });

    it("ignores a second vacant client seed while the first persist is in flight", async () => {
        const persistence = new GatedPersistence();
        const { io, room } = createRoom({
            getInitialStorage: () => Promise.resolve(null),
            persistence,
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await Promise.all([
            registerAuthorized(room, first, { io }),
            registerAuthorized(room, second, { io }),
        ]);

        const firstInit = initializeSession(room, first, encode("alpha"));
        const secondInit = initializeSession(room, second, encode("beta"));

        await tick();

        expect(lastMessage(second, "$storageReceived").data.changeKind).toBe("unchanged");
        expect(decode(lastMessage(second, "$storageReceived").data.state)).toBe("alpha");

        persistence.persist.resolve();
        await Promise.all([firstInit, secondInit]);

        expect(lastMessage(first, "$storageReceived").data.changeKind).toBe("initialized");
        expect(decode(lastMessage(first, "$storageReceived").data.state)).toBe("alpha");
        expect(decode((await persistence.getStorageState("storage-init")) ?? "")).toBe("alpha");
    });

    it("does not apply $updateStorage origin $initialized after a claimed load", async () => {
        const { io, persistence, room } = createRoom({
            getInitialStorage: () => Promise.resolve(encode("server")),
        });
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initializeSession(room, socket, encode("client"));
        await updateStorage(room, socket, "$initialized", encode("client"));

        expect(decode(lastMessage(socket, "$storageReceived").data.state)).toBe("server");
        expect(await persistence.getStorageState("storage-init")).toBeNull();
    });

    it("still applies $updateStorage origin null", async () => {
        const { io, persistence, room } = createRoom({
            getInitialStorage: () => Promise.resolve(encode("server")),
        });
        const socket = new TestSocket("session-1");

        await registerAuthorized(room, socket, { io });
        await initializeSession(room, socket, encode("client"));

        const base = lastMessage(socket, "$storageReceived").data.state as string;

        await updateStorage(room, socket, null, append(base, " live"));

        expect(decode((await persistence.getStorageState("storage-init")) ?? "")).toBe(
            "server live",
        );
    });

    it("merges two overlapping live origin-null updates", async () => {
        const { io, persistence, room } = createRoom({
            getInitialStorage: () => Promise.resolve(encode("base")),
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await Promise.all([
            registerAuthorized(room, first, { io }),
            registerAuthorized(room, second, { io }),
        ]);
        await initializeSession(room, first, encode("client"));

        const base = lastMessage(first, "$storageReceived").data.state as string;

        await Promise.all([
            updateStorage(room, first, null, append(base, "A")),
            updateStorage(room, second, null, append(base, "B")),
        ]);

        const stored = decode((await persistence.getStorageState("storage-init")) ?? "");

        expect(stored).toContain("A");
        expect(stored).toContain("B");
    });
});

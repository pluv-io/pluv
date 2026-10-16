import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import type { PluvIOLimits, RoomEffects, SessionRoom } from "@pluv/io";
import { createIO, manageSessions } from "@pluv/io";
import { loadUserFacet } from "@pluv/platform/load-user-facet";
import { platformPluv, type PluvSocket, RoomFacet } from "@pluv/platform";
import { createTreaty } from "@pluv/treaty";
import type { TreatyLike } from "@pluv/types";
import { applyUpdate, Doc as YDoc } from "yjs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    createAuthorizedToken,
    TEST_AUTH_SECRET,
    deferred,
    encodedStateWithContent,
    registerAuthorized,
    TestPersistence,
    TestPlatform,
    TestSocket,
    testAuthorizeUser,
    waitForStorageCheckpoint,
    waitUntil,
} from "./__utils__";

const packageRoot = fileURLToPath(new URL("../../../packages/platform/", import.meta.url));

const decodeText = (encodedState: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));

    return doc.getText("content").toString();
};

const lastMessage = (socket: TestSocket, type: string): { type: string; data: any } => {
    const message = socket.messages.findLast((entry) => entry.type === type);

    if (!message) throw new Error(`Missing ${type} message`);

    return message;
};

const send = async (
    room: { onMessage: (socket: TestSocket) => (event: { data: string }) => Promise<void> },
    socket: TestSocket,
    type: string,
    data: unknown,
): Promise<void> => {
    await room.onMessage(socket)({ data: JSON.stringify({ type, data }) });
};

const createHostIO = <TTreaty extends TreatyLike>(options: {
    maxConnections?: number;
    persistence?: TestPersistence;
    treaty: TTreaty;
}) => {
    return createIO()
        .platform(platformPluv(options.persistence ? { persistence: options.persistence } : {}))
        .config({
            limits: { maxConnections: options.maxConnections ?? 4 },
            secret: TEST_AUTH_SECRET,
            treaty: options.treaty,
        });
};

const host = (options?: {
    holdFirstRegister?: Promise<void>;
    lastPings?: Map<TestSocket, number>;
    maxConnections?: number;
    onStorageUpdated?: (encodedState: string) => void;
    persistence?: TestPersistence;
    waitForPresence?: () => Promise<void>;
    waitForSlow?: () => Promise<void>;
}) => {
    const calls: string[] = [];
    const sessions: PluvSocket[] = [];
    let storageReads = 0;
    let loads = 0;
    let kept = 0;
    let activeRegisters = 0;
    let maxRegisters = 0;
    const roomId = "facet-room";
    const state = {
        get storage() {
            storageReads += 1;

            return {};
        },
        getWebSockets() {
            throw new Error("The room facet must not read sockets.");
        },
    };
    const presence = z.object({ selectionId: z.string().nullable() });
    const storage = yjs.schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) });
    const treatyBuilder = createTreaty({ presence, storage, user: testAuthorizeUser });
    const select = treatyBuilder.procedure.presence
        .input(z.object({ id: z.string().nullable() }))
        .resolve(async ({ id }) => {
            await options?.waitForPresence?.();

            return { selectionId: id };
        });
    const addMessage = treatyBuilder.procedure.storage
        .input(z.object({ text: z.string() }))
        .resolve(({ text }, { storage: docStorage }) => {
            docStorage.messages.push([text]);
        });
    const treaty = treatyBuilder.router({ addMessage, select });
    const io = createHostIO({
        maxConnections: options?.maxConnections,
        persistence: options?.persistence,
        treaty,
    });
    const server = io.server({
        getInitialStorage: () => null,
        onStorageUpdated: (event) => {
            if (typeof event.encodedState !== "string") return;

            options?.onStorageUpdated?.(event.encodedState);
        },
        router: io.router({
            hello: io.procedure
                .input(z.object({ text: z.string() }))
                .broadcast(({ text }) => ({ heard: { text } })),
            fail: io.procedure.broadcast(() => {
                throw new Error("plain failure");
            }),
            slow: io.procedure.broadcast(async () => {
                await options?.waitForSlow?.();

                return { heard: { text: "later" } };
            }),
        }),
    });
    let facet: RoomFacet | null = null;
    const open = (): RoomFacet => {
        if (facet) return facet;

        loads += 1;
        facet = new RoomFacet({
            keepAlive: (promise) => {
                kept += 1;
                void promise;
            },
            room: server.createRoom(roomId, {
                env: {},
                sessions,
                state,
            }) as unknown as SessionRoom,
        });

        return facet;
    };
    const onFrames = (effects: RoomEffects, senderId: string): Promise<void> => {
        if (!hostedRoom) return Promise.resolve();

        return hostedRoom.applyFrames(effects, senderId);
    };
    const retainedFrames = Object.assign(onFrames, {
        dup: () => {
            const copy = Object.assign(
                (effects: RoomEffects) => {
                    if (!effects.connectionId) return Promise.resolve();

                    return onFrames(effects, effects.connectionId);
                },
                { [Symbol.dispose]: () => undefined },
            );

            return copy;
        },
    });
    const stub: SessionRoom = {
        id: roomId,
        get limits(): PluvIOLimits | null {
            return storedLimits;
        },
        "~": {
            applyPresencePatch: (params) => {
                calls.push("applyPresencePatch");

                return open().applyPresencePatch({
                    data: params.data,
                    name: params.name,
                    onPresence: (patch) => {
                        if (!hostedRoom) return Promise.resolve();

                        return hostedRoom.applyPresence({
                            name: params.name,
                            patch,
                            senderId: params.session.id,
                        });
                    },
                    session: params.session,
                });
            },
            applyStorageProcedure: async (params) => {
                calls.push("applyStorageProcedure");

                return open().applyStorageProcedure(params);
            },
            close: async (session) => {
                calls.push("close");

                return open().close(session);
            },
            destroy: async () => {
                calls.push("destroy");
                await open().destroy();
            },
            flushCheckpoint: async () => {
                calls.push("flushCheckpoint");

                return open().flushCheckpoint() as ReturnType<SessionRoom["~"]["flushCheckpoint"]>;
            },
            garbageCollect: async (snapshots) => {
                calls.push("garbageCollect");

                return open().garbageCollect(snapshots);
            },
            initializeStorage: async (params) => {
                calls.push("initializeStorage");

                return open().initializeStorage(params) as ReturnType<
                    SessionRoom["~"]["initializeStorage"]
                >;
            },
            logDebug: (...data) => {
                calls.push("logDebug");
                open().logDebug(...data);
            },
            message: async (session, event) => {
                calls.push("message");

                return open().message({
                    event,
                    onFrames: (effects) => retainedFrames.dup()(effects),
                    session,
                });
            },
            register: async (...args) => {
                calls.push("register");
                activeRegisters += 1;
                maxRegisters = Math.max(maxRegisters, activeRegisters);

                if (calls.filter((call) => call === "register").length === 1) {
                    await options?.holdFirstRegister;
                }

                try {
                    const registered = await open().register(...args);

                    storedLimits = registered.limits;
                    plainRegister = registered.result;

                    return {
                        encodedState: registered.result.encodedState,
                        error: registered.result.error
                            ? new Error(registered.result.error.message)
                            : null,
                        kind: registered.result.kind,
                        operator: registered.result.operator,
                        user: registered.result.user,
                    } as Awaited<ReturnType<SessionRoom["~"]["register"]>>;
                } finally {
                    activeRegisters -= 1;
                }
            },
            storageDirty: () => {
                calls.push("storageDirty");

                return open().storageDirty();
            },
            userConnected: async (params) => {
                calls.push("userConnected");

                return open().userConnected(params as never);
            },
            whenReady: () => {
                calls.push("whenReady");

                return open().whenReady();
            },
        },
    };
    let storedLimits: PluvIOLimits | null = null;
    let hostedRoom: ReturnType<typeof manageSessions> | null = null;
    let plainRegister: { error: { message: string } | null } | null = null;
    hostedRoom = manageSessions(stub, new TestPlatform({ lastPings: options?.lastPings }));

    return {
        calls,
        io,
        kept: () => kept,
        loads: () => loads,
        maxRegisters: () => maxRegisters,
        plainRegister: () => plainRegister,
        room: hostedRoom,
        storageReads: () => storageReads,
    };
};

describe("@pluv/platform", () => {
    it("keeps cloudflare:workers off the end-user entry", () => {
        const entry = [
            "src/index.ts",
            "src/platformPluv.ts",
            "src/PluvPlatform.ts",
            "dist/index.mjs",
        ];

        for (const file of entry) {
            expect(readFileSync(join(packageRoot, file), "utf8")).not.toContain(
                "cloudflare:workers",
            );
        }
    });

    it("returns the session snapshot and does not read durable object sockets", async () => {
        let readSockets = false;
        const sessions: PluvSocket[] = [{ id: "socket-1", lastPing: 5 }];
        const state = {
            waitUntil(promise: Promise<unknown>) {
                void promise;
            },
            getWebSockets() {
                readSockets = true;

                return [];
            },
        };
        const platform = platformPluv()().initialize({
            roomContext: {
                sessions,
                state,
            },
        });

        const socket = platform.convertWebSocket(sessions[0]!, { room: "facet-room" });

        expect(platform.getWebSockets()).toBe(sessions);
        expect(platform.getLastPing(socket)).toBe(5);
        expect(readSockets).toBe(false);
        await expect(platform.acceptWebSocket(undefined as never)).rejects.toThrow(
            /does not accept sockets/,
        );
        expect(() => socket.send("hi")).toThrow(/does not accept sockets/);
        expect(() => socket.close()).toThrow(/does not accept sockets/);
        expect(() => socket.terminate()).toThrow(/does not accept sockets/);
    });

    it("loads the facet from the module version", async () => {
        let version = "";
        let className = "";
        const facet = loadUserFacet(
            {
                facets: {
                    get: (name, getStartupOptions) => {
                        expect(name).toBe("user");

                        return getStartupOptions();
                    },
                },
            },
            {
                get: (id, getCode) => {
                    version = id;
                    const code = getCode();

                    expect(code.mainModule).toBe("facet.js");
                    expect(code.modules["user-server.js"]).toContain("export default");

                    return {
                        getDurableObjectClass: (name) => {
                            className = name;

                            return name;
                        },
                    };
                },
            },
            {
                version: "module-1",
                code: () => ({
                    compatibilityDate: "2026-04-03",
                    mainModule: "facet.js",
                    modules: {
                        "facet.js": "export {}",
                        "user-server.js": "export default {}",
                    },
                }),
            },
        );

        await facet;

        expect(version).toBe("module-1");
        expect(className).toBe("UserRoomFacet");
    });

    it("does not wake the room for a ping", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");

        expect(hosted.loads()).toBe(0);
        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        expect(hosted.loads()).toBe(1);

        const reads = hosted.storageReads();
        const calls = hosted.calls.length;

        await send(hosted.room, socket, "$ping", {});

        const added = hosted.calls.slice(calls);

        expect(hosted.storageReads()).toBe(reads);
        expect(added).not.toContain("whenReady");
        expect(added).not.toContain("message");
        expect(added).not.toContain("initializeStorage");
        expect(added).not.toContain("flushCheckpoint");
        expect(added).not.toContain("storageDirty");
        expect(lastMessage(socket, "$pong").type).toBe("$pong");
    });

    it("delivers one custom procedure to the other socket", async () => {
        const hosted = host();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "hello", { text: "hi" });

        expect(lastMessage(second, "heard").data).toEqual({ text: "hi" });
    });

    it("keeps a plain procedure error message", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "fail", {});

        expect(lastMessage(socket, "$error").data).toEqual({
            message: "plain failure",
            stack: null,
        });
    });

    it("delivers one storage update", async () => {
        const hosted = host();
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });
        await hosted.room.__experimental_storage.addMessage({ text: "hello" }, first.id);

        expect(lastMessage(second, "$storageUpdated").type).toBe("$storageUpdated");
    });

    it("flushes $userJoined and $storageReceived together", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        expect(socket.messages.some((message) => message.type === "$userJoined")).toBe(false);
        expect(socket.messages.some((message) => message.type === "$storageReceived")).toBe(false);

        await send(hosted.room, socket, "$initializeSession", { presence: {}, update: null });

        expect(socket.messages.some((message) => message.type === "$userJoined")).toBe(true);
        expect(socket.messages.some((message) => message.type === "$storageReceived")).toBe(true);
    });

    it("rejects a register for the wrong room", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");
        const token = await createAuthorizedToken(hosted.io, {
            room: "other-room",
            user: { id: socket.id },
        });

        await hosted.room.register(socket, { token });

        expect(lastMessage(socket, "$error").data.message).toBe("Not authorized");
        expect(hosted.calls).toContain("register");
        expect(JSON.parse(JSON.stringify(hosted.plainRegister()))).toEqual({
            encodedState: null,
            error: { message: "Not authorized" },
            kind: null,
            operator: null,
            user: null,
        });
    });

    it("closes a quiet socket from garbageCollect", async () => {
        const lastPings = new Map<TestSocket, number>();
        const hosted = host({ lastPings });
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        lastPings.set(socket, Date.now() - 60_000);

        await hosted.room.garbageCollect();

        expect(hosted.calls).toContain("close");
        expect(hosted.calls).not.toContain("garbageCollect");
    });

    it("writes frames after a procedure suspends", async () => {
        const gate = deferred();
        const hosted = host({ waitForSlow: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });

        const sent = send(hosted.room, first, "slow", {});

        await sent;
        expect(hosted.kept()).toBe(1);
        expect(second.messages.some((message) => message.type === "heard")).toBe(false);

        gate.resolve();
        await waitUntil(() => second.messages.some((message) => message.type === "heard"));

        expect(lastMessage(second, "heard").data).toEqual({ text: "later" });
    });

    it("writes a presence patch after a presence procedure suspends", async () => {
        const gate = deferred();
        const hosted = host({ waitForPresence: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });
        await send(hosted.room, second, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });

        const update = hosted.room.__experimental_presence.select({ id: "item-1" }, first.id);

        await update;
        expect(second.messages.some((message) => message.type === "$presenceUpdated")).toBe(false);

        gate.resolve();
        await waitUntil(() =>
            second.messages.some((message) => message.type === "$presenceUpdated"),
        );

        expect(lastMessage(second, "$presenceUpdated").data.session.presence).toEqual({
            selectionId: "item-1",
        });
    });

    it("starts one checkpoint from storageDirty and flushes on a second call", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "$initializeSession", { presence: {}, update: null });
        await hosted.room.__experimental_storage.addMessage({ text: "hello" }, socket.id);

        expect(hosted.calls).toContain("applyStorageProcedure");
        expect(hosted.calls).not.toContain("flushCheckpoint");

        await waitForStorageCheckpoint();

        expect(hosted.calls.filter((call) => call === "flushCheckpoint")).toEqual([
            "flushCheckpoint",
        ]);
    });

    it("does not notify onStorageUpdated until a failed seed is copied", async () => {
        const persistence = new TestPersistence();
        let attempts = 0;
        const store = persistence.setStorageState.bind(persistence);
        const updates: string[] = [];

        persistence.setStorageState = (room, state) => {
            attempts += 1;

            if (attempts === 1) return Promise.reject(new Error("storage unavailable"));

            return store(room, state);
        };

        const hosted = host({
            onStorageUpdated: (encodedState) => {
                updates.push(encodedState);
            },
            persistence,
        });
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "$initializeSession", {
            presence: {},
            update: encodedStateWithContent("seeded"),
        });

        expect(updates).toEqual([]);
        expect(lastMessage(socket, "$storageReceived").data.changeKind).toBe("initialized");

        await waitForStorageCheckpoint();

        expect(updates).toHaveLength(1);
        expect(decodeText(updates[0] ?? "")).toBe("seeded");
    });

    it("admits one register at a time until limits are stored", async () => {
        const gate = deferred();
        const hosted = host({ holdFirstRegister: gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const firstRegister = registerAuthorized(hosted.room, first, { io: hosted.io });

        await waitUntil(() => hosted.maxRegisters() === 1);

        const secondRegister = registerAuthorized(hosted.room, second, { io: hosted.io });

        await waitUntil(() => hosted.calls.filter((call) => call === "register").length === 1);
        expect(hosted.maxRegisters()).toBe(1);

        gate.resolve();
        await firstRegister;
        await secondRegister;

        expect(hosted.maxRegisters()).toBe(1);
        expect(hosted.room.getSize()).toBe(2);
    });

    it("rejects a full room without another register", async () => {
        const hosted = host({ maxConnections: 1 });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await hosted.room.register(second, {
            token: await createAuthorizedToken(hosted.io, {
                room: "facet-room",
                user: { id: second.id },
            }),
        });

        expect(hosted.calls.filter((call) => call === "register")).toEqual(["register"]);
        expect(lastMessage(second, "$error").data.message).toContain("maxConnections");
    });
});

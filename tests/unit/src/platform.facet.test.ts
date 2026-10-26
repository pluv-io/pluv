import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import type { PluvIOLimits, RoomEffects, SessionRoom } from "@pluv/io";
import { createIO, deferredResult, isSuspended, manageSessions } from "@pluv/io";
import { loadUserFacet } from "@pluv/platform/load-user-facet";
import { platformPluv, type PluvSocket, RoomFacet } from "@pluv/platform";
import { createTreaty } from "@pluv/treaty";
import type { TreatyLike } from "@pluv/types";
import { applyUpdate, Doc as YDoc } from "yjs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
    createAuthorizedToken,
    TEST_AUTH_SECRET,
    deferred,
    encodedStateWithContent,
    tick,
    registerAuthorized,
    TestPersistence,
    TestPlatform,
    TestSocket,
    testAuthorizeUser,
    waitForStorageSnapshot,
    waitUntil,
} from "./__utils__";

const packageRoot = fileURLToPath(new URL("../../../packages/platform/", import.meta.url));

const decodeText = (encodedState: string): string => {
    const doc = new YDoc();

    applyUpdate(doc, Buffer.from(encodedState, "base64"));

    return doc.getText("content").toJSON();
};

const messageTurn = (promise: Promise<never>) => {
    return Object.defineProperty({}, "$u", { value: promise });
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
        .platform(platformPluv({ persistence: options.persistence ?? new TestPersistence() }))
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
    onStorageEdits?: (event: {
        changes: readonly {
            procedure: string | null;
            update: string;
            user: { id: string } | null;
        }[];
    }) => void;
    onStorageSnapshot?: (encodedState: string) => void;
    persistence?: TestPersistence;
    waitForPresence?: () => Promise<void>;
    waitForSlow?: () => Promise<void>;
    waitForStorage?: () => Promise<void>;
    failFrames?: boolean;
    failStoragePrepare?: boolean;
    holdDelivery?: () => Promise<void>;
    failFlushOnce?: boolean;
    failPresence?: boolean;
    failStorageResolve?: boolean;
    messageError?: string;
}) => {
    const calls: string[] = [];
    let storageReads = 0;
    let loads = 0;
    let kept = 0;
    const awake: Promise<unknown>[] = [];
    let activeRegisters = 0;
    let maxRegisters = 0;
    const flushes: string[] = [];
    let flushAttempts = 0;
    const roomId = "facet-room";
    const state = {
        get storage() {
            storageReads += 1;

            return {};
        },
        getWebSockets() {
            throw new Error("The room facet must not read sockets.");
        },
        waitUntil(promise: Promise<unknown>) {
            awake.push(promise);
        },
    };
    const presence = z.object({ selectionId: z.string().nullable() });
    const storage = yjs.schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) });
    const treatyBuilder = createTreaty({ presence, storage, user: testAuthorizeUser });
    const select = treatyBuilder.procedure.presence
        .input(z.object({ id: z.string().nullable() }))
        .resolve(async ({ id }) => {
            await options?.waitForPresence?.();

            if (options?.failPresence) throw new Error("presence failed");

            return { selectionId: id };
        });
    const addMessage = treatyBuilder.procedure.storage
        .input(z.object({ text: z.string() }))
        .resolve(({ text }, { storage: docStorage }) => {
            docStorage.messages.push([text]);
        });
    const loadMessage = treatyBuilder.procedure.storage
        .input(z.object({ text: z.string() }))
        .prepare(async ({ text }) => {
            if (options?.failStoragePrepare) throw new Error("load failed");

            await options?.waitForStorage?.();

            return text;
        })
        .resolve((_input, { storage: docStorage }, loaded) => {
            if (options?.failStorageResolve) throw new Error("storage resolve failed");

            docStorage.messages.push([loaded]);
        });
    const treaty = treatyBuilder.router({ addMessage, loadMessage, select });
    const io = createHostIO({
        maxConnections: options?.maxConnections,
        persistence: options?.persistence,
        treaty,
    });
    const server = io.server({
        getInitialStorage: () => null,
        ...(options?.onStorageEdits ? { onStorageEdits: options.onStorageEdits } : {}),
        onStorageSnapshot: (event) => {
            if (typeof event.encodedState !== "string") return;

            options?.onStorageSnapshot?.(event.encodedState);
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
            immediate: io.procedure.broadcast(async () => ({ heard: { text: "now" } })),
            saveLater: io.procedure.broadcast(async (_input, { doc }) => {
                await options?.waitForSlow?.();

                doc.get("content").insert(0, "saved");

                return { heard: { text: "saved" } };
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
                state,
            }),
        });

        return facet;
    };
    const deliverFrames = async (effects: RoomEffects): Promise<void> => {
        if (options?.failFrames) return Promise.reject(new Error("delivery failed"));

        if (effects.broadcast.some((frame) => frame.type === "$storageUpdated")) {
            await options?.holdDelivery?.();
        }

        if (!hostedRoom || !effects.connectionId) return Promise.resolve();

        return hostedRoom.writeFrames(effects, effects.connectionId);
    };
    const noteStorageDirty = (): void => {
        calls.push("noteStorageDirty");
        hostedRoom?.noteStorageDirty();
    };
    const retryUnsent = (effects: RoomEffects): void => {
        hostedRoom?.retryUnsent(effects);
    };
    const frames = {
        deliverFrames,
        noteStorageDirty,
        retryUnsent,
        dup: () => ({
            deliverFrames,
            noteStorageDirty,
            retryUnsent,
            [Symbol.dispose]: () => undefined,
        }),
    };
    const stub: SessionRoom = {
        id: roomId,
        treaty,
        get limits(): PluvIOLimits | null {
            return storedLimits;
        },
        "~": {
            applyPresencePatch: (params) => {
                calls.push("applyPresencePatch");

                return open().applyPresencePatch({
                    data: params.data,
                    name: params.name,
                    onPresence: {
                        deliverPresence: ({ error, name, patch, senderId }) => {
                            if (!hostedRoom) return Promise.resolve();

                            if (error) {
                                return hostedRoom.applyFrames(
                                    {
                                        attachments: [],
                                        broadcast: [],
                                        closes: [],
                                        connectionId: senderId,
                                        destroy: false,
                                        error: { message: error.message },
                                        self: [],
                                        storageDirty: false,
                                    },
                                    senderId,
                                );
                            }

                            return hostedRoom.applyPresence({ name, patch, senderId });
                        },
                    },
                    session: params.session,
                });
            },
            applyStorageProcedure: async (params) => {
                calls.push("applyStorageProcedure");

                let resolveDelivery: (effects: RoomEffects) => void = () => undefined;
                let rejectDelivery: (error: Error) => void = () => undefined;
                const delivery = new Promise<RoomEffects>((resolve, reject) => {
                    resolveDelivery = resolve;
                    rejectDelivery = reject;
                });
                const result = await open().applyStorageProcedure({
                    ...params,
                    onFrames: {
                        deliverFrames: (effects) => frames.deliverFrames(effects),
                        finish: (error) => {
                            if (error) {
                                rejectDelivery(new Error(error.message));

                                return;
                            }

                            resolveDelivery({
                                attachments: [],
                                broadcast: [],
                                closes: [],
                                connectionId: null,
                                destroy: false,
                                error: null,
                                self: [],
                                storageDirty: false,
                            });
                        },
                        noteStorageDirty,
                        retryUnsent,
                    },
                });

                if (isSuspended(result)) return deferredResult(delivery);

                return result;
            },
            commitLoadedStorage: () => {
                throw new Error("Prepared storage commits in the room");
            },
            close: async (session) => {
                calls.push("close");

                return open().close(session);
            },
            destroy: async () => {
                calls.push("destroy");
                await open().destroy();
            },
            flushSnapshot: async () => {
                calls.push("flushSnapshot");

                const flushed = (await open().flushSnapshot()) as Awaited<
                    ReturnType<SessionRoom["~"]["flushSnapshot"]>
                >;

                flushAttempts += 1;

                if (options?.failFlushOnce && flushAttempts === 1) {
                    throw new Error("flush broadcast failed");
                }

                flushes.push(flushed.status);

                return flushed;
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

                if (options?.messageError) {
                    return { error: { message: options.messageError }, suspended: true as const };
                }

                return open().message({
                    event,
                    onFrames: frames,
                    session,
                });
            },
            dropStorageUpdates: (updates) => {
                return open().dropStorageUpdates(updates);
            },
            queueStorageFrames: (updates) => {
                open().queueStorageFrames(updates);
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
        awake,
        calls,
        flushes,
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

    it("throws when the room has no sqlite and no persistence adapter", () => {
        expect(() => {
            platformPluv()().initialize({ roomContext: { state: {} } });
        }).toThrow(/sqlite storage or a persistence adapter/i);
    });

    it("throws when sqlite storage has no waitUntil", () => {
        expect(() => {
            platformPluv()().initialize({
                roomContext: {
                    state: {
                        storage: {
                            sql: {
                                exec: () => undefined,
                            },
                        },
                    },
                },
            });
        }).toThrow(/waitUntil/i);
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
        const platform = platformPluv({ persistence: new TestPersistence() })().initialize({
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
        expect(added).not.toContain("flushSnapshot");
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
        await hosted.room
            .__experimental_storage({ senderId: first.id })
            .addMessage({ text: "hello" });

        expect(lastMessage(second, "$storageUpdated").type).toBe("$storageUpdated");
    });

    it("broadcasts a prepared storage write after the hosted load", async () => {
        const gate = deferred<void>();
        const hosted = host({ waitForStorage: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const viewed = yjs
            .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
            .getEmpty();

        try {
            await registerAuthorized(hosted.room, first, { io: hosted.io });
            await registerAuthorized(hosted.room, second, { io: hosted.io });
            await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
            await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

            const pending = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "hello" });

            await tick(5);

            expect(
                second.messages.filter((message) => message.type === "$storageUpdated"),
            ).toHaveLength(0);

            const settled = await Promise.race([
                pending.then(() => "resolved" as const),
                tick().then(() => "waiting" as const),
            ]);

            expect(settled).toBe("waiting");

            gate.resolve();
            await pending;

            expect(
                second.messages.filter((message) => message.type === "$storageUpdated"),
            ).toHaveLength(1);
            viewed.applyEncodedState({
                update: lastMessage(second, "$storageUpdated").data.state as string,
            });
            expect(viewed.toJson()).toEqual({ messages: ["hello"] });
        } finally {
            viewed.destroy();
        }
    });

    it("rejects a hosted call when prepare fails", async () => {
        const hosted = host({ failStoragePrepare: true });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

        await expect(
            hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "hello" }),
        ).rejects.toThrow("load failed");

        expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual([]);
    });

    it("lets another storage write run while a hosted prepare waits", async () => {
        const gate = deferred<void>();
        const hosted = host({ waitForStorage: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

        const pending = hosted.room
            .__experimental_storage({ senderId: first.id })
            .loadMessage({ text: "hello" });

        await tick();

        const wroteDuring = hosted.room
            .__experimental_storage({ senderId: first.id })
            .addMessage({ text: "during" });
        const outcome = await Promise.race([
            wroteDuring.then(() => "wrote" as const),
            tick(5).then(() => "blocked" as const),
        ]);

        expect(outcome).toBe("wrote");
        await wroteDuring;
        expect(
            second.messages.filter((message) => message.type === "$storageUpdated"),
        ).toHaveLength(1);

        gate.resolve();
        await pending;
        expect(
            second.messages.filter((message) => message.type === "$storageUpdated"),
        ).toHaveLength(2);
    });

    it("commits hosted prepares in call order", async () => {
        const firstGate = deferred<void>();
        const secondGate = deferred<void>();
        let started = 0;
        const hosted = host({
            waitForStorage: () => {
                started += 1;

                return started === 1 ? firstGate.promise : secondGate.promise;
            },
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const viewed = yjs
            .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
            .getEmpty();

        try {
            await registerAuthorized(hosted.room, first, { io: hosted.io });
            await registerAuthorized(hosted.room, second, { io: hosted.io });
            await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
            await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

            const earlier = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "first" });

            await tick();

            const later = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "second" });

            await tick();
            expect(started).toBe(2);

            secondGate.resolve();
            await tick(5);

            expect(second.messages.filter((message) => message.type === "$storageUpdated")).toEqual(
                [],
            );

            firstGate.resolve();
            await earlier;
            await later;

            for (const message of second.messages.filter(
                (entry) => entry.type === "$storageUpdated",
            )) {
                viewed.applyEncodedState({ update: message.data.state as string });
            }

            expect(viewed.toJson()).toEqual({ messages: ["first", "second"] });
        } finally {
            viewed.destroy();
        }
    });

    it("rejects a hosted storage call when the commit throws", async () => {
        const gate = deferred<void>();
        const hosted = host({
            failStorageResolve: true,
            waitForStorage: () => gate.promise,
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        try {
            await registerAuthorized(hosted.room, first, { io: hosted.io });
            await registerAuthorized(hosted.room, second, { io: hosted.io });
            await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
            await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

            const pending = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "hello" });

            await tick(5);
            gate.resolve();

            await expect(pending).rejects.toThrow("storage resolve failed");
            expect(spy).toHaveBeenCalledTimes(1);
            await hosted.room
                .__experimental_storage({ senderId: first.id })
                .addMessage({ text: "after" });
            expect(
                second.messages.filter((message) => message.type === "$storageUpdated"),
            ).toHaveLength(1);
        } finally {
            spy.mockRestore();
        }
    });

    it("broadcasts a hosted write when frame delivery fails", async () => {
        const gate = deferred<void>();
        const hosted = host({
            failFrames: true,
            waitForStorage: () => gate.promise,
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        const viewed = yjs
            .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
            .getEmpty();

        try {
            await registerAuthorized(hosted.room, first, { io: hosted.io });
            await registerAuthorized(hosted.room, second, { io: hosted.io });
            await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
            await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

            const pending = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "hello" });

            await tick(5);
            gate.resolve();

            await expect(pending).rejects.toThrow("delivery failed");
            await waitUntil(
                () =>
                    second.messages.filter((message) => message.type === "$storageUpdated")
                        .length === 1,
            );

            viewed.applyEncodedState({
                update: lastMessage(second, "$storageUpdated").data.state as string,
            });
            expect(viewed.toJson()).toEqual({ messages: ["hello"] });
        } finally {
            viewed.destroy();
            spy.mockRestore();
        }
    });

    it("keeps a hosted prepare off another turn's storage release", async () => {
        const prepare = deferred<void>();
        const delivery = deferred<void>();
        let delivering = false;
        const hosted = host({
            holdDelivery: () => {
                delivering = true;

                return delivery.promise;
            },
            waitForStorage: () => prepare.promise,
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");
        const viewed = yjs
            .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
            .getEmpty();

        try {
            await registerAuthorized(hosted.room, first, { io: hosted.io });
            await registerAuthorized(hosted.room, second, { io: hosted.io });
            await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
            await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });

            const pending = hosted.room
                .__experimental_storage({ senderId: first.id })
                .loadMessage({ text: "owned" });

            await tick(5);
            prepare.resolve();
            await waitUntil(() => delivering);

            await hosted.room
                .__experimental_storage({ senderId: first.id })
                .addMessage({ text: "other" });

            const during = second.messages.filter((message) => message.type === "$storageUpdated");

            expect(during).toHaveLength(1);
            viewed.applyEncodedState({ update: during[0]?.data.state as string });
            expect(viewed.toJson().messages ?? []).not.toContain("owned");

            delivery.resolve();
            await pending;

            const merged = yjs
                .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
                .getEmpty();

            try {
                for (const message of second.messages.filter(
                    (entry) => entry.type === "$storageUpdated",
                )) {
                    merged.applyEncodedState({ update: message.data.state as string });
                }

                expect(merged.toJson().messages).toEqual(["owned", "other"]);
            } finally {
                merged.destroy();
            }
        } finally {
            delivery.resolve();
            viewed.destroy();
        }
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

    it("delivers a settled async procedure without the frame callback", async () => {
        const hosted = host({ failFrames: true });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });

        await send(hosted.room, first, "immediate", {});

        expect(lastMessage(second, "heard").data).toEqual({ text: "now" });
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

        const update = hosted.room.__experimental_presence({ senderId: first.id }).select({
            id: "item-1",
        });

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

    it("sends $error when a suspended presence resolver rejects", async () => {
        const hosted = host({ failPresence: true });
        const first = new TestSocket("session-1");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });

        await hosted.room.__experimental_presence({ senderId: first.id }).select({ id: "item-1" });
        await waitUntil(() => first.messages.some((message) => message.type === "$error"));

        expect(lastMessage(first, "$error").data).toEqual({
            message: "presence failed",
            stack: null,
        });
    });

    it("returns $error when a message turn rejects before the call returns", async () => {
        const room = {
            id: "room-1",
            limits: null,
            "~": {
                message: () =>
                    messageTurn(
                        new Promise<never>((_resolve, reject) => {
                            setTimeout(() => reject(new Error("message failed")), 0);
                        }),
                    ),
            },
        } as unknown as SessionRoom;
        const facet = new RoomFacet({
            keepAlive: () => undefined,
            room,
        });
        const result = await facet.message({
            event: { data: {}, type: "hello" },
            onFrames: {
                deliverFrames: () => undefined,
                noteStorageDirty: () => undefined,
                retryUnsent: () => undefined,
            },
            session: { id: "session-1" } as Parameters<RoomFacet["message"]>[0]["session"],
        });

        expect(result).toEqual({ error: { message: "message failed" }, suspended: true });
    });

    it("sends $error when a message turn is already rejected", async () => {
        const hosted = host({ messageError: "message failed" });
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "hello", { text: "hi" });

        expect(lastMessage(socket, "$error").data.message).toBe("message failed");
    });

    it("sends $error when a pending message turn rejects", async () => {
        let rejectTurn: (error: Error) => void = () => undefined;
        const pending = new Promise<never>((_resolve, reject) => {
            rejectTurn = reject;
        });
        const delivered: RoomEffects[] = [];
        const room = {
            id: "room-1",
            limits: null,
            "~": {
                message: () => messageTurn(pending),
            },
        } as unknown as SessionRoom;
        const facet = new RoomFacet({
            keepAlive: () => undefined,
            room,
        });
        const result = await facet.message({
            event: { data: {}, type: "hello" },
            onFrames: {
                deliverFrames: (effects) => {
                    delivered.push(effects);
                },
                noteStorageDirty: () => undefined,
                retryUnsent: () => undefined,
            },
            session: { id: "session-1" } as Parameters<RoomFacet["message"]>[0]["session"],
        });

        expect(result).toEqual({ suspended: true });

        rejectTurn(new Error("message failed"));
        await waitUntil(() => delivered.length === 1);

        expect(delivered[0]?.connectionId).toBe("session-1");
        expect(delivered[0]?.error).toEqual({ message: "message failed" });
    });

    it("broadcasts the storage update when frame delivery fails", async () => {
        const gate = deferred();
        const hosted = host({ failFrames: true, waitForSlow: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });
        await waitForStorageSnapshot();

        const before = second.messages.filter(
            (message) => message.type === "$storageUpdated",
        ).length;
        const sent = send(hosted.room, first, "saveLater", {});

        await sent;
        expect(
            second.messages.filter((message) => message.type === "$storageUpdated"),
        ).toHaveLength(before);

        gate.resolve();
        await waitUntil(
            () =>
                second.messages.filter((message) => message.type === "$storageUpdated").length >
                before,
        );

        expect(decodeText(lastMessage(second, "$storageUpdated").data.state)).toBe("saved");
        expect(lastMessage(second, "heard").data).toEqual({ text: "saved" });
    });

    it("broadcasts a document write once when frame delivery succeeds", async () => {
        const gate = deferred();
        const hosted = host({ waitForSlow: () => gate.promise });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });
        await waitForStorageSnapshot();

        const before = second.messages.filter(
            (message) => message.type === "$storageUpdated",
        ).length;
        const sent = send(hosted.room, first, "saveLater", {});

        await sent;
        expect(second.messages.filter((message) => message.type === "heard")).toHaveLength(0);

        gate.resolve();
        await waitUntil(
            () =>
                second.messages.filter((message) => message.type === "$storageUpdated").length >
                    before &&
                second.messages.filter((message) => message.type === "heard").length === 1,
        );
        await waitForStorageSnapshot();

        expect(
            second.messages.filter((message) => message.type === "$storageUpdated"),
        ).toHaveLength(before + 1);
        expect(second.messages.filter((message) => message.type === "heard")).toEqual([
            expect.objectContaining({ data: { text: "saved" } }),
        ]);
        expect(decodeText(lastMessage(second, "$storageUpdated").data.state)).toBe("saved");
    });

    it("retries the storage broadcast when the flush write fails", async () => {
        const gate = deferred();
        const hosted = host({
            failFlushOnce: true,
            failFrames: true,
            waitForSlow: () => gate.promise,
        });
        const first = new TestSocket("session-1");
        const second = new TestSocket("session-2");

        await registerAuthorized(hosted.room, first, { io: hosted.io });
        await registerAuthorized(hosted.room, second, { io: hosted.io });
        await send(hosted.room, first, "$initializeSession", { presence: {}, update: null });
        await send(hosted.room, second, "$initializeSession", { presence: {}, update: null });
        await waitForStorageSnapshot();

        const before = second.messages.filter(
            (message) => message.type === "$storageUpdated",
        ).length;
        const sent = send(hosted.room, first, "saveLater", {});

        await sent;
        gate.resolve();
        await waitUntil(
            () =>
                second.messages.filter((message) => message.type === "$storageUpdated").length >
                before,
        );

        expect(decodeText(lastMessage(second, "$storageUpdated").data.state)).toBe("saved");
        expect(hosted.calls.filter((call) => call === "flushSnapshot").length).toBeGreaterThan(1);
    });

    it("starts one snapshot from storageDirty and flushes on a second call", async () => {
        const hosted = host();
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "$initializeSession", { presence: {}, update: null });
        await hosted.room.__experimental_storage({ senderId: socket.id }).addMessage({
            text: "hello",
        });

        expect(hosted.calls).toContain("applyStorageProcedure");
        expect(hosted.calls).not.toContain("flushSnapshot");

        await waitForStorageSnapshot();

        expect(hosted.calls.filter((call) => call === "flushSnapshot")).toEqual(["flushSnapshot"]);
    });

    it("keeps the facet awake until flush copies a dirty document", async () => {
        const persistence = new TestPersistence();
        const hosted = host({ persistence });
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "$initializeSession", { presence: {}, update: null });

        const beforeWrite = hosted.awake.length;

        await hosted.room.__experimental_storage({ senderId: socket.id }).addMessage({
            text: "hello",
        });

        expect(hosted.awake).toHaveLength(beforeWrite + 1);

        const pending = hosted.awake[beforeWrite];

        if (!pending) throw new Error("Expected the facet to stay awake.");

        let settled = false;

        void pending.then(() => {
            settled = true;
        });
        await Promise.resolve();

        expect(settled).toBe(false);

        await waitForStorageSnapshot();
        await pending;

        expect(settled).toBe(true);
        expect(hosted.flushes.at(-1)).toBe("clean");

        const copy = hosted.io.server({ getInitialStorage: () => null }).createRoom("facet-room", {
            env: {},
            state: {
                waitUntil(promise: Promise<unknown>) {
                    void promise;
                },
            },
        });
        const reloaded = new RoomFacet({
            keepAlive: (promise) => {
                void promise;
            },
            room: copy,
        });
        const loaded = await reloaded.initializeStorage({
            actor: { id: "reloader", kind: "user", operator: null, user: { id: "ada" } },
            input: {},
        });
        const doc = yjs
            .schema({ content: yjs.yText(), messages: yjs.yArray(s.string()) })
            .getEmpty();

        doc.applyEncodedState({ update: loaded.state ?? "" });
        doc.rebuildStorage();

        expect(doc.toJson()).toMatchObject({ messages: ["hello"] });
    });

    it("does not notify onStorageSnapshot until a failed seed is copied", async () => {
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
            onStorageSnapshot: (encodedState) => {
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

        await waitForStorageSnapshot();

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

    it("reports storage edits from the room inside the facet", async () => {
        const batches: { procedure: string | null; user: { id: string } | null }[][] = [];
        const hosted = host({
            onStorageEdits: (event) => {
                batches.push(
                    event.changes.map((change) => ({
                        procedure: change.procedure,
                        user: change.user,
                    })),
                );
            },
        });
        const socket = new TestSocket("session-1");

        await registerAuthorized(hosted.room, socket, { io: hosted.io });
        await send(hosted.room, socket, "$initializeSession", {
            presence: { selectionId: null },
            update: null,
        });
        await hosted.room.__experimental_storage({ senderId: socket.id }).addMessage({
            text: "facet",
        });
        await waitForStorageSnapshot();

        expect(batches).toHaveLength(1);
        expect(batches[0]).toEqual([{ procedure: "addMessage", user: { id: "session-1" } }]);
    });
});

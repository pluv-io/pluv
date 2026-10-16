import type { PluvIOLimits, RoomEffects, SessionRoom } from "@pluv/io";
import type { JsonObject } from "@pluv/types";
import { manageSessions, type RoomSessionManager } from "@pluv/io";
import type { RoomFacet } from "@pluv/platform";
import { loadUserFacet, type FacetParent } from "@pluv/platform/load-user-facet";
import { infer, platformCloudflare } from "@pluv/platform-cloudflare";
import { DurableObject } from "cloudflare:workers";
import facetSource from "./generated/facet.bundle.txt";
import userServerSource from "./generated/user-server.bundle.txt";

const GARBAGE_COLLECT_INTERVAL_MS = 30_000;
const LIMITS_KEY = "limits";

type UserFacet = {
    applyPresencePatch: RoomFacet["applyPresencePatch"];
    applyStorageProcedure: RoomFacet["applyStorageProcedure"];
    close: RoomFacet["close"];
    destroy: RoomFacet["destroy"];
    flushCheckpoint: RoomFacet["flushCheckpoint"];
    initializeStorage: RoomFacet["initializeStorage"];
    logDebug: RoomFacet["logDebug"];
    message: RoomFacet["message"];
    register: RoomFacet["register"];
    storageDirty: RoomFacet["storageDirty"];
    userConnected: RoomFacet["userConnected"];
    whenReady: RoomFacet["whenReady"];
};

export interface PlatformEnv {
    LOADER: WorkerLoader;
    rooms: DurableObjectNamespace<RoomSupervisor>;
}

const emptyEffects = (): RoomEffects => {
    return {
        attachments: [],
        broadcast: [],
        closes: [],
        connectionId: null,
        destroy: false,
        error: null,
        self: [],
        storageDirty: false,
    };
};

/**
 * Test supervisor. Sockets stay here. The room facet loads on the first call
 * that needs it, and `$ping` is answered by the hibernation auto-response.
 */
export class RoomSupervisor extends DurableObject<PlatformEnv> {
    #facet: UserFacet | null = null;
    #limits: PluvIOLimits | null = null;
    #sessions: RoomSessionManager;

    constructor(ctx: DurableObjectState, env: PlatformEnv) {
        super(ctx, env);

        const roomId = ctx.id.name;

        if (!roomId) throw new Error("Room supervisor requires a named id.");

        ctx.blockConcurrencyWhile(async () => {
            this.#limits = (await ctx.storage.get<PluvIOLimits>(LIMITS_KEY)) ?? null;
        });

        const platform = platformCloudflare({
            types: infer((i) => ({ env: i<PlatformEnv> })),
        })().initialize({
            roomContext: { env, state: ctx },
        });

        this.#sessions = manageSessions(this.#sessionRoom(roomId), platform);
    }

    async fetch(request: Request): Promise<Response> {
        if (request.headers.get("Upgrade") !== "websocket") {
            return new Response("Expected websocket", { status: 400 });
        }

        const { 0: client, 1: server } = new WebSocketPair();
        const token = new URL(request.url).searchParams.get("token");
        const alarm = await this.ctx.storage.getAlarm();

        if (alarm === null) {
            await this.ctx.storage.setAlarm(Date.now() + GARBAGE_COLLECT_INTERVAL_MS);
        }

        await this.#sessions.register(server, { env: this.env, request, token });

        return new Response(null, { status: 101, webSocket: client });
    }

    public async alarm(): Promise<void> {
        await this.#sessions.garbageCollect();
        await this.ctx.storage.setAlarm(Date.now() + GARBAGE_COLLECT_INTERVAL_MS);
    }

    public async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
        await this.#sessions.onClose(ws)({ code, reason });
    }

    public async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
        const eventError = error instanceof Error ? error : new Error("Internal Error");

        await this.#sessions.onError(ws)({ error: eventError, message: eventError.message });
    }

    public async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
        await this.#sessions.onMessage(ws)({ data: message });
    }

    #open(): UserFacet {
        if (this.#facet) return this.#facet;

        const parent: FacetParent = {
            facets: {
                get: (name, getStartupOptions) =>
                    this.ctx.facets.get(name, getStartupOptions as never),
            },
        };
        const facet = loadUserFacet(parent, this.env.LOADER, {
            version: "platform-e2e",
            code: () => ({
                compatibilityDate: "2026-10-08",
                globalOutbound: null,
                mainModule: "facet.js",
                modules: {
                    "facet.js": facetSource,
                    "user-server.js": userServerSource,
                },
            }),
        }) as UserFacet;

        this.#facet = facet;

        return facet;
    }

    #sessionRoom(roomId: string): SessionRoom {
        const supervisor = this;
        const onFrames = async (effects: RoomEffects): Promise<void> => {
            if (!effects.connectionId) return;

            await this.#sessions.applyFrames(effects, effects.connectionId);
        };

        return {
            id: roomId,
            get limits() {
                return supervisor.#limits;
            },
            "~": {
                applyPresencePatch: (params) => {
                    return this.#open().applyPresencePatch({
                        data: params.data,
                        name: params.name,
                        onPresence: (patch: JsonObject | null) => {
                            if (!patch) return Promise.resolve();

                            return this.#sessions.applyPresence({
                                name: params.name,
                                patch,
                                senderId: params.session.id,
                            });
                        },
                        session: params.session,
                    });
                },
                applyStorageProcedure: (params) => this.#open().applyStorageProcedure(params),
                close: (session) => this.#open().close(session),
                destroy: async () => {
                    await this.#open().destroy();
                },
                flushCheckpoint: async () => {
                    const flushed = await this.#open().flushCheckpoint();

                    return flushed as Awaited<ReturnType<SessionRoom["~"]["flushCheckpoint"]>>;
                },
                garbageCollect: async () => emptyEffects(),
                initializeStorage: (params) =>
                    this.#open().initializeStorage(params) as ReturnType<
                        SessionRoom["~"]["initializeStorage"]
                    >,
                logDebug: () => undefined,
                message: (session, event) => {
                    return this.#open().message({
                        event,
                        onFrames,
                        session,
                    });
                },
                register: async (...args) => {
                    const token = args[0]?.token ?? null;
                    const registered = await this.#open().register({ token });

                    if (registered.limits) {
                        this.#limits = registered.limits;
                        await this.ctx.storage.put(LIMITS_KEY, registered.limits);
                    }

                    return {
                        encodedState: registered.result.encodedState,
                        error: registered.result.error
                            ? new Error(registered.result.error.message)
                            : null,
                        kind: registered.result.kind,
                        operator: registered.result.operator,
                        user: registered.result.user,
                    } as Awaited<ReturnType<SessionRoom["~"]["register"]>>;
                },
                storageDirty: () => this.#open().storageDirty(),
                userConnected: (params) => this.#open().userConnected(params as never),
                whenReady: () => this.#open().whenReady(),
            },
        };
    }
}

import {
    deferredResult,
    isSuspended,
    manageSessions,
    type PluvIOLimits,
    type RoomEffects,
    type RoomSessionManager,
    type SessionRoom,
} from "@pluv/io";
import type { WorkerCode, WorkerLoader } from "@pluv/platform/load-user-facet";
import { loadUserFacet, type FacetParent } from "@pluv/platform/load-user-facet";
import type { RoomFacet } from "@pluv/platform";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import type { JsonObject } from "@pluv/types";
import { DurableObject, RpcTarget } from "cloudflare:workers";
import { isObject } from "../utils/isObject";

export { COMPATIBILITY_DATE } from "../constants";

const GARBAGE_COLLECT_INTERVAL_MS = 30_000;
const LIMITS_KEY = "limits";

export type RoomSupervisorBindings = {
    LOADER: WorkerLoader;
};

export type RoomSupervisorConfig<TEnv extends RoomSupervisorBindings> = {
    /**
     * `loader.get` key. A new key loads new module code.
     * The facet name stays `user`, so its SQLite is kept.
     */
    version: string;
    code: (env: TEnv) => WorkerCode;
};

const isPresenceWait = (result: object): boolean => {
    const keys = Object.keys(result);

    return (
        keys.length === 1 &&
        keys[0] === "$suspended" &&
        (result as { $suspended?: unknown }).$suspended === true
    );
};

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

const userTreaty = new Proxy(
    {},
    {
        get() {
            throw new Error("The room supervisor does not read the user treaty.");
        },
    },
) as SessionRoom["treaty"];

/**
 * Per-call callback for a prepared storage write. The facet retains `dup` after
 * the RPC returns.
 */
class StorageProcedureDelivery extends RpcTarget {
    #delivery: RoomDelivery;
    #done: (effects: RoomEffects) => void;
    #fail: (error: Error) => void;

    constructor(
        delivery: RoomDelivery,
        done: (effects: RoomEffects) => void,
        fail: (error: Error) => void,
    ) {
        super();
        this.#delivery = delivery;
        this.#done = done;
        this.#fail = fail;
    }

    public async deliverFrames(effects: RoomEffects): Promise<void> {
        await this.#delivery.deliverFrames(effects);
    }

    public finish(error: { message: string } | null): void {
        if (error) this.#fail(new Error(error.message));
        else this.#done(emptyEffects());
    }

    public noteStorageDirty(): void {
        this.#delivery.noteStorageDirty();
    }

    public retryUnsent(effects: RoomEffects): void {
        this.#delivery.retryUnsent(effects);
    }
}

class PresenceProcedureDelivery extends RpcTarget {
    #delivery: RoomDelivery;
    #done: (patch: JsonObject | null) => void;
    #fail: (error: Error) => void;

    constructor(
        delivery: RoomDelivery,
        done: (patch: JsonObject | null) => void,
        fail: (error: Error) => void,
    ) {
        super();
        this.#delivery = delivery;
        this.#done = done;
        this.#fail = fail;
    }

    public async deliverPresence(params: {
        error: { message: string } | null;
        name: string;
        patch: JsonObject | null;
        senderId: string;
    }): Promise<void> {
        if (!params.error) {
            this.#done(params.patch);

            return;
        }

        try {
            await this.#delivery.deliverPresence(params);
        } finally {
            this.#fail(new Error(params.error.message));
        }
    }
}

/**
 * Callback the facet retains after its RPC returns. A Durable Object stub's
 * `dup` is an RPC, and that name is reserved.
 */
class RoomDelivery extends RpcTarget {
    #sessions: RoomSessionManager;

    constructor(sessions: RoomSessionManager) {
        super();
        this.#sessions = sessions;
    }

    public async deliverFrames(effects: RoomEffects): Promise<void> {
        if (!effects.connectionId) return;

        await this.#sessions.writeFrames(effects, effects.connectionId);
    }

    public noteStorageDirty(): void {
        this.#sessions.noteStorageDirty();
    }

    public retryUnsent(effects: RoomEffects): void {
        this.#sessions.retryUnsent(effects);
    }

    public async deliverPresence(params: {
        error: { message: string } | null;
        name: string;
        patch: JsonObject | null;
        senderId: string;
    }): Promise<void> {
        if (!params.error) return;

        await this.#sessions.applyFrames(
            {
                ...emptyEffects(),
                connectionId: params.senderId,
                error: { message: params.error.message },
            },
            params.senderId,
        );
    }
}

type RoomSupervisorClass<TEnv extends RoomSupervisorBindings> = new (
    ctx: DurableObjectState,
    env: TEnv,
) => DurableObject<TEnv>;

/**
 * Sockets stay on this Durable Object. The user module loads in a facet.
 * `$ping` is answered by the hibernation auto-response.
 */
export const createRoomSupervisor = <TEnv extends RoomSupervisorBindings>(
    config: RoomSupervisorConfig<TEnv>,
): RoomSupervisorClass<TEnv> => {
    return class RoomSupervisor extends DurableObject<TEnv> {
        #delivery: RoomDelivery;
        #facet: RoomFacet | null = null;
        #limits: PluvIOLimits | null = null;
        #sessions: RoomSessionManager;

        constructor(ctx: DurableObjectState, env: TEnv) {
            super(ctx, env);

            const roomId = ctx.id.name;

            if (!roomId) throw new Error("Room supervisor requires a named id.");

            void ctx.blockConcurrencyWhile(async () => {
                this.#limits = (await ctx.storage.get<PluvIOLimits>(LIMITS_KEY)) ?? null;
            });

            const platform = platformCloudflare()().initialize({
                roomContext: { env, state: ctx },
            });

            this.#sessions = manageSessions(this.#sessionRoom(roomId), platform);
            this.#delivery = new RoomDelivery(this.#sessions);
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

            if (this.#sessions.getSize() === 0) return;

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

        #open(): RoomFacet {
            if (this.#facet) return this.#facet;

            const parent: FacetParent = {
                facets: {
                    get: (name, getStartupOptions) =>
                        this.ctx.facets.get(name, getStartupOptions as never),
                },
            };
            const facet = loadUserFacet(parent, this.env.LOADER, {
                version: config.version,
                code: () => config.code(this.env),
            }) as RoomFacet;

            this.#facet = facet;

            return facet;
        }

        #sessionRoom(roomId: string): SessionRoom {
            const readLimits = (): PluvIOLimits | null => this.#limits;

            return {
                id: roomId,
                treaty: userTreaty,
                get limits() {
                    return readLimits();
                },
                "~": {
                    applyPresencePatch: async (params) => {
                        let resolveDelivery: (patch: JsonObject | null) => void = () => undefined;
                        let rejectDelivery: (error: Error) => void = () => undefined;
                        const delivery = new Promise<JsonObject | null>((resolve, reject) => {
                            resolveDelivery = resolve;
                            rejectDelivery = reject;
                        });
                        const result = await this.#open().applyPresencePatch({
                            ...params,
                            onPresence: new PresenceProcedureDelivery(
                                this.#delivery,
                                resolveDelivery,
                                rejectDelivery,
                            ),
                        });

                        if (isObject(result) && isPresenceWait(result)) {
                            return deferredResult(delivery);
                        }

                        return result;
                    },
                    applyStorageProcedure: async (params) => {
                        let resolveDelivery: (effects: RoomEffects) => void = () => undefined;
                        let rejectDelivery: (error: Error) => void = () => undefined;
                        const delivery = new Promise<RoomEffects>((resolve, reject) => {
                            resolveDelivery = resolve;
                            rejectDelivery = reject;
                        });
                        const result = await this.#open().applyStorageProcedure({
                            ...params,
                            onFrames: new StorageProcedureDelivery(
                                this.#delivery,
                                resolveDelivery,
                                rejectDelivery,
                            ),
                        });

                        if (isSuspended(result)) return deferredResult(delivery);

                        return result;
                    },
                    commitLoadedStorage: () => {
                        throw new Error("Prepared storage commits in the room");
                    },
                    close: (session) => this.#open().close(session),
                    destroy: async () => {
                        await this.#open().destroy();
                    },
                    flushSnapshot: async () => {
                        const flushed = await this.#open().flushSnapshot();

                        return flushed as Awaited<ReturnType<SessionRoom["~"]["flushSnapshot"]>>;
                    },
                    initializeStorage: (params) =>
                        this.#open().initializeStorage(params) as ReturnType<
                            SessionRoom["~"]["initializeStorage"]
                        >,
                    logDebug: () => undefined,
                    message: (session, event) => {
                        return this.#open().message({
                            event,
                            onFrames: this.#delivery,
                            session,
                        });
                    },
                    dropStorageUpdates: (frames) => {
                        return this.#open().dropStorageUpdates(frames);
                    },
                    queueStorageFrames: (frames) => {
                        this.#open().queueStorageFrames(frames);
                    },
                    readStorageJson: () => this.#open().readStorageJson(),
                    register: async (...args) => {
                        const token = args[0]?.token ?? null;
                        const registered = await this.#open().register({ token });
                        const limits = registered.limits;

                        if (limits && JSON.stringify(this.#limits) !== JSON.stringify(limits)) {
                            this.#limits = limits;
                            await this.ctx.storage.put(LIMITS_KEY, limits);
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
    };
};

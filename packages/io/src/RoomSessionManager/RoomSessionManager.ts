import type {
    EventMessage,
    Id,
    InferIOInput,
    IOEventMessage,
    JsonObject,
    ListUsersOptions,
    ListUsersResult,
    PresenceProcedureProxy,
} from "@pluv/types";
import type { InferInitContextType, InferPlatformWebSocketSource } from "../AbstractPlatform";
import type { IOPubSubEventMessage } from "../AbstractPubSub";
import type {
    AbstractCloseEvent,
    AbstractErrorEvent,
    AbstractMessageEvent,
} from "../AbstractWebSocket";
import { AbstractWebSocket } from "../AbstractWebSocket";
import type { IODefs } from "../IODefs";
import type {
    HostPresenceInvoke,
    HostStorageInvoke,
    HostTreatyProcedureActor,
    IORoom,
} from "../IORoom";
import type {
    RoomEffectFrame,
    RoomEffects,
    RoomSessionSnapshot,
    SessionRoom,
    WebSocketRegisterConfig,
} from "../types";
import {
    deferredResultPromise,
    isDeferredResult,
    isErrorMessage,
    isSuspended,
} from "../roomEffects";
import { ExclusiveUntil } from "../ExclusiveUntil";
import { JoinQueue } from "../JoinQueue";
import { RoomSessions } from "../RoomSessions";
import { createSessionRouter } from "../createSessionRouter";
import {
    GARBAGE_COLLECT_INTERVAL_MS,
    PING_TIMEOUT_MS,
    ROOM_STATS_THROTTLE_MS,
    STORAGE_CHECKPOINT_INTERVAL_MS,
    isServerOriginEvent,
} from "../constants";
import type { SendMessageOptions, SessionEventContext, WebSocketType } from "../types";
import { createHostTreatyProcedureProxy } from "./createHostTreatyProcedureProxy";
import { readTreatySchema, type TreatySchemaJson } from "./readTreatySchema";
import { resolveHostTreatyProcedureSenderId } from "./resolveHostTreatyProcedureSenderId";
import {
    assertExhaustive,
    getRoomStatsFromSessions,
    getSessionKind,
    getSessionOperator,
    invokeProcedureResolvers,
    oneLine,
    pageLiveUsers,
    parsePluvSchema,
    resolveMaxConnections,
    throttle,
} from "../utils";
import colors from "kleur";

export type BroadcastProxy<TIO extends IORoom<any>> = (<TEvent extends keyof InferIOInput<TIO>>(
    event: TEvent,
    data: Id<InferIOInput<TIO>[TEvent]>,
    senderId: string,
) => Promise<void>) & {
    [event in keyof InferIOInput<TIO>]: (
        data: Id<InferIOInput<TIO>>[event],
        senderId: string,
    ) => Promise<void>;
};

/**
 * Session manager for one room. `createRoom` returns the room.
 * `manageSessions` attaches the sockets.
 */
export class RoomSessionManager<T extends IODefs = IODefs> {
    public readonly broadcast: BroadcastProxy<IORoom<T>>;
    public readonly __experimental_presence: HostPresenceInvoke<IORoom<T>>;
    public readonly __experimental_storage: HostStorageInvoke<IORoom<T>>;

    private readonly _platform: T["platform"];
    private readonly _sessions: RoomSessions<T>;
    private readonly _sessionRouter: ReturnType<typeof createSessionRouter<T>>;
    private readonly _roomStats: ReturnType<typeof throttle>;
    private readonly _queue = new JoinQueue();
    private readonly _limits = new ExclusiveUntil(() => this._room.limits !== null);
    private _closing = 0;
    private _connecting = 0;
    private _registering = 0;
    private _checkpoint: Promise<void> | null = null;
    private _retry: Promise<void> | null = null;
    private _lastGarbageCollectMs = -1 * (GARBAGE_COLLECT_INTERVAL_MS + 1);
    /** Procedure frames whose delivery failed. This isolate outlives the facet. */
    private _unsent: { effects: RoomEffects<T>; id: number }[] = [];
    private _unsentId = 0;
    private _treatySchema?: TreatySchemaJson;

    constructor(
        private readonly _room: SessionRoom<T>,
        platform: T["platform"],
    ) {
        this._platform = platform;
        this._sessions = new RoomSessions<T>({ platform: this._platform });
        this._sessionRouter = createSessionRouter<T>({
            limits: () => this._room.limits,
        });
        this._roomStats = throttle(
            () => {
                void this._emitRoomStats();
            },
            { wait: ROOM_STATS_THROTTLE_MS },
        );
        this.broadcast = this._createBroadcast();
        this.__experimental_presence = this._createPresence();
        this.__experimental_storage = this._createStorage();

        this._hydrate();
        void this._platform.pubSub.subscribe(this._room.id, async (payload) => {
            await this._onPublished(payload);
        });
    }

    public get id(): string {
        return this._room.id;
    }

    public getTreatySchema(): TreatySchemaJson {
        this._treatySchema ??= readTreatySchema(this._room.treaty);

        return structuredClone(this._treatySchema);
    }

    public async register(
        webSocket: InferPlatformWebSocketSource<T["platform"]>,
        ...options: keyof InferInitContextType<T["platform"]> extends never
            ? [{ token?: string }?]
            : [WebSocketRegisterConfig<T["platform"]>]
    ): Promise<void> {
        const sessionId = this._platform.getSessionId(webSocket);

        if (typeof sessionId === "string" && this._sessions.has(sessionId)) return;

        await this._limits.run(async () => {
            const limits = this._room.limits;
            const maxConnections = limits ? resolveMaxConnections(limits) : null;
            const rejectMaxConnections = (): void => {
                const rejected = this._platform.convertWebSocket(webSocket, {
                    room: this._room.id,
                });
                const limit = maxConnections ?? 0;

                rejected.handleError({
                    error: new Error(`Room is at maxConnections (${limit.toLocaleString()}).`),
                    room: this._room.id,
                });
                rejected.close(4000, "Room is at maxConnections");
            };

            if (
                maxConnections !== null &&
                this._sessions.getSize() + this._registering >= maxConnections
            ) {
                rejectMaxConnections();

                return;
            }

            this._registering += 1;

            let reserved = true;
            const releaseReservation = (): void => {
                if (!reserved) return;

                reserved = false;
                this._registering -= 1;
            };

            await this._queue.finish<{
                effects: RoomEffects<T> | null;
                socket: AbstractWebSocket;
            } | null>(
                async () => {
                    try {
                        const result = await this._room["~"].register(...options);

                        if (result.error || !result.user || !result.kind) {
                            const rejected = this._platform.convertWebSocket(webSocket, {
                                room: this._room.id,
                            });

                            rejected.handleError({
                                error: result.error ?? new Error("Not authorized"),
                                room: this._room.id,
                            });
                            rejected.close(3000, "WebSocket unauthorized.");

                            return { value: null };
                        }

                        const pluvWs = this._platform.convertWebSocket(webSocket, {
                            room: this._room.id,
                        });
                        const participantId = result.user.id;
                        const latest = this._sessions.getLatestPresence(participantId, result.kind);
                        const prevState = pluvWs.state;

                        pluvWs.user = result.user;
                        this._platform.setSerializedState(pluvWs, {
                            ...prevState,
                            kind: result.kind,
                            operator: result.operator,
                            presence: latest.presence,
                            seq: { ...prevState.seq, presence: latest.seq },
                        });
                        this._sessions.addParticipantSession({
                            id: participantId,
                            kind: result.kind,
                            sessionId: pluvWs.sessionId,
                        });
                        this._room["~"].logDebug(
                            `${colors.blue(`Registering connection for room ${this._room.id}:`)} ${pluvWs.sessionId}`,
                        );
                        await this._platform.acceptWebSocket(pluvWs);
                        this._sessions.set(pluvWs.sessionId, pluvWs);
                        releaseReservation();
                        await this._platform.persistence.addUser(
                            this._room.id,
                            pluvWs.sessionId,
                            result.user,
                        );

                        const registered = this._sessions.toSession(pluvWs);
                        const stats = getRoomStatsFromSessions(this._sessions.getLiveSessions());

                        await this._writeFrames(
                            [
                                {
                                    connectionId: registered.id,
                                    data: {
                                        session: {
                                            kind: result.kind,
                                            operator: result.operator,
                                            presence: registered.presence,
                                            seq: { presence: registered.seq.presence },
                                        },
                                        sessionId: registered.id,
                                        state: result.encodedState,
                                        stats,
                                    },
                                    operator: result.operator,
                                    type: "$registered",
                                    user: result.user,
                                },
                            ],
                            "self",
                        );

                        const { encodedState, kind, operator, user } = result;

                        if (!kind || !user) return { value: null };

                        this._connecting += 1;

                        return {
                            pending: this._room["~"]
                                .userConnected({
                                    encodedState,
                                    id: pluvWs.sessionId,
                                    kind,
                                    operator,
                                    user,
                                })
                                .then(
                                    (effects) => ({ effects, socket: pluvWs }),
                                    (error: unknown) => {
                                        console.error(error);

                                        return { effects: null, socket: pluvWs };
                                    },
                                ),
                        };
                    } catch (error) {
                        releaseReservation();

                        throw error;
                    }
                },
                async (connected) => {
                    try {
                        if (!connected?.effects) return;

                        await this._applyEffects(connected.effects, connected.socket);
                        this._roomStats.schedule();
                        this._room["~"].logDebug(oneLine`
                            ${colors.blue(`Registered connection for room ${this._room.id}:`)}
                            ${connected.socket.sessionId}
                        `);
                        this._room["~"].logDebug(
                            `${colors.blue(`Room ${this._room.id} size:`)} ${this._sessions.getSize()}`,
                        );
                    } finally {
                        releaseReservation();

                        if (connected) {
                            this._connecting -= 1;
                            await this._destroyEmptyRoom();
                        }
                    }
                },
            );
        });
    }

    public applyFrames(effects: RoomEffects<T>, senderId: string): Promise<void> {
        return this._queue.join(async () => {
            await this._applyEffects(effects, this._socket(senderId));
        });
    }

    /** Writes sockets only. The facet drops storage after `deliverFrames` returns. */
    public writeFrames(effects: RoomEffects<T>, senderId: string): Promise<void> {
        return this._queue.join(async () => {
            await this._applyEffects(effects, this._socket(senderId), false);
        });
    }

    public applyPresence(params: {
        name: string;
        patch: JsonObject | null;
        senderId: string;
    }): Promise<void> {
        const socket = this._sessions.get(params.senderId) ?? null;

        if (!socket) return Promise.resolve();

        return this._queue.join(async () => {
            const context = this._sessionContext(socket);
            const broadcastResult =
                await this._sessionRouter._defs.events.$updatePresence.config.broadcast?.(
                    { presence: params.patch, procedure: params.name },
                    context,
                );

            await this._deliverRecord(
                broadcastResult as Record<string, unknown> | null,
                socket,
                "broadcast",
            );
        });
    }

    public onMessage(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractMessageEvent) => Promise<void> {
        const socket = this._sessions.resolve(webSocket);

        if (!socket) return async () => undefined;

        return this._onSocketMessage(webSocket);
    }

    public onClose(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractCloseEvent) => Promise<void> {
        return async (event) => {
            const socket = this._sessions.resolve(webSocket);

            if (!socket) return;
            if (!this._sessions.has(socket.sessionId)) return;

            await this._disconnect(socket, event.code, event.reason, false);
        };
    }

    public onError(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractErrorEvent) => Promise<void> {
        return async () => {
            const socket = this._sessions.resolve(webSocket);

            if (!socket) return;
            if (!this._sessions.has(socket.sessionId)) return;

            await this._disconnect(socket, 1011, "", false);
        };
    }

    public async garbageCollect(): Promise<void> {
        this._lastGarbageCollectMs = Date.now();

        const quitting = await this._queue.join(async () =>
            Array.from(this._sessions.values()).filter((socket) => !this._isLiveSocket(socket)),
        );

        if (!quitting.length) {
            if (this._sessions.getSize() === 0) this._roomStats.cancel();
            else this._roomStats.schedule();

            return;
        }

        await this._unregisterSockets({
            code: 1000,
            reason: "Ping timed out.",
            sockets: quitting,
            closeSocket: true,
            sync: true,
        });
    }

    public async evict(sessionId: string): Promise<void> {
        const socket = this._sessions.get(sessionId);

        if (!socket) return;

        socket.state.quit = true;
        await this._evictSockets({ code: 1000, reason: "", sockets: [socket] });
    }

    public async evictAll(): Promise<void> {
        const sockets = Array.from(this._sessions.values());

        sockets.forEach((socket) => {
            socket.state.quit = true;
        });
        await this._evictSockets({ code: 1000, reason: "", sockets });
    }

    public getSize(): number {
        return this._sessions.getSize();
    }

    public noteStorageDirty(): void {
        if (this._checkpoint) return;

        const run = this._saveUntilClean();

        this._checkpoint = run;
        this._platform.keepAlive(run);
        void run.finally(() => {
            if (this._checkpoint === run) this._checkpoint = null;
        });
    }

    public retryUnsent(effects: RoomEffects<T>): void {
        this._unsentId += 1;
        this._unsent.push({ effects, id: this._unsentId });

        if (this._retry) return;

        const run = this._deliverUnsent();

        this._retry = run;
        this._platform.keepAlive(run);
        void run.finally(() => {
            if (this._retry === run) this._retry = null;
        });
    }

    public listUsers(options: ListUsersOptions = {}): ListUsersResult<IORoom<T>> {
        return pageLiveUsers(this._sessions.getLiveSessions(), options) as ListUsersResult<
            IORoom<T>
        >;
    }

    private _socket(senderId: string): AbstractWebSocket | null {
        return this._sessions.get(senderId) ?? null;
    }

    private async _applyEffects(
        effects: RoomEffects<T>,
        sender: AbstractWebSocket | null,
        dropStorage = true,
    ): Promise<void> {
        this._noteStorage(effects);

        for (const attachment of effects.attachments) {
            this._sessions.setPresence(attachment);
        }

        if (effects.error) {
            const storageFrames = effects.broadcast.filter(
                (frame) => frame.type === "$storageUpdated",
            );

            if (storageFrames.length) {
                await this._writeFrames(storageFrames, "broadcast");

                if (dropStorage) await this._room["~"].dropStorageUpdates(storageFrames);
            }

            sender?.handleError({
                error: effects.error,
                room: this._room.id,
                ...(sender ? { session: this._sessions.toSession(sender) } : {}),
            });

            return;
        }

        await this._writeFrames(effects.broadcast, "broadcast");

        if (dropStorage) {
            const storageFrames = effects.broadcast.filter(
                (frame) => frame.type === "$storageUpdated",
            );

            if (storageFrames.length) await this._room["~"].dropStorageUpdates(storageFrames);
        }

        await this._writeFrames(effects.self, "self");
    }

    private async _collectPong(): Promise<void> {
        if (Date.now() - this._lastGarbageCollectMs > GARBAGE_COLLECT_INTERVAL_MS) {
            await this.garbageCollect();
        }
    }

    private _createBroadcast(): BroadcastProxy<IORoom<T>> {
        const send = <TEvent extends keyof InferIOInput<IORoom<T>>>(
            event: TEvent,
            data: Id<InferIOInput<IORoom<T>>[TEvent]>,
            senderId: string,
        ): Promise<void> => {
            if (typeof senderId !== "string") {
                throw new Error("room.broadcast of a user event requires a senderId");
            }

            const socket = this._sessions.get(senderId) ?? null;
            const session = socket ? this._sessions.toSession(socket) : null;

            return this._publish({
                connectionId: senderId,
                data,
                operator: session ? getSessionOperator(session) : null,
                type: event as string,
                user: session?.user ?? null,
            });
        };

        return new Proxy(send, {
            get(fn, prop) {
                return (data: unknown, senderId: string) =>
                    fn(prop as never, data as never, senderId);
            },
        }) as BroadcastProxy<IORoom<T>>;
    }

    private _createPresence(): HostPresenceInvoke<IORoom<T>> {
        return (actor: HostTreatyProcedureActor) => {
            const senderId = resolveHostTreatyProcedureSenderId(actor);

            const invoke = async (name: string, data: unknown): Promise<void> => {
                const socket = this._sessions.get(senderId) ?? null;

                if (!socket) throw new Error(`Unknown senderId: ${senderId}`);

                await this._queue.finish(
                    async () => {
                        const patch = await this._room["~"].applyPresencePatch({
                            name,
                            data,
                            session: this._toSnapshot(socket),
                        });

                        if (isDeferredResult(patch)) {
                            return { pending: deferredResultPromise(patch) };
                        }

                        if (isSuspended(patch)) {
                            if ("error" in patch && isErrorMessage(patch.error)) {
                                socket.handleError({
                                    error: patch.error,
                                    room: this._room.id,
                                    session: this._sessions.toSession(socket),
                                });
                            }

                            return { suspended: true as const };
                        }

                        return { value: patch };
                    },
                    async (patch) => {
                        const context = this._sessionContext(socket);
                        const broadcastResult =
                            await this._sessionRouter._defs.events.$updatePresence.config.broadcast?.(
                                { presence: patch, procedure: name },
                                context,
                            );

                        await this._deliverRecord(
                            broadcastResult as Record<string, unknown> | null,
                            socket,
                            "broadcast",
                        );
                    },
                );
            };

            return createHostTreatyProcedureProxy(invoke) as PresenceProcedureProxy<
                IORoom<T>["_defs"]["treaty"]["_defs"]["procedures"]["presence"]
            >;
        };
    }

    private _createStorage(): HostStorageInvoke<IORoom<T>> {
        return (actor: HostTreatyProcedureActor) => {
            const senderId = resolveHostTreatyProcedureSenderId(actor);

            const invoke = async (name: string, data: unknown): Promise<void> => {
                const socket = this._sessions.get(senderId) ?? null;

                if (!socket) throw new Error(`Unknown senderId: ${senderId}`);

                await this._queue.join(async () => {
                    const effects = await this._room["~"].applyStorageProcedure({
                        name,
                        data,
                        actor: this._toSnapshot(socket),
                    });

                    this._noteStorage(effects);
                    await this._writeFrames(effects.broadcast, "broadcast");
                    await this._room["~"].dropStorageUpdates(effects.broadcast);
                });
            };

            return createHostTreatyProcedureProxy(invoke) as ReturnType<
                HostStorageInvoke<IORoom<T>>
            >;
        };
    }

    private async _deliverRecord(
        record: Record<string, unknown> | null | undefined,
        socket: AbstractWebSocket,
        mode: "broadcast" | "self",
    ): Promise<void> {
        if (!record) return;

        const session = this._sessions.toSession(socket);
        const frames = Object.entries(record).map(([type, data]) => ({
            connectionId: session.id,
            data,
            operator: getSessionOperator(session),
            type,
            user: session.user,
        }));

        await this._writeFrames(frames, mode);
    }

    private async _destroyEmptyRoom(): Promise<void> {
        if (this._sessions.all().size !== 0) return;

        if (this._connecting !== 0 || this._registering !== 0) {
            void this._queue.join(() => this._destroyIdleRoom());

            return;
        }

        await this._destroyIdleRoom();
    }

    private async _destroyIdleRoom(): Promise<void> {
        if (this._sessions.all().size !== 0) return;

        if (this._connecting !== 0 || this._registering !== 0) return;

        // A close still has to send $exit. That close destroys once it finishes.
        if (this._closing !== 0) return;

        try {
            await this._room["~"].destroy();
        } catch (error) {
            console.error(error);
        }
    }

    private async _disconnect(
        socket: AbstractWebSocket,
        code: number,
        reason: string,
        closeSocket: boolean,
    ): Promise<void> {
        await this._unregisterSockets({
            code,
            reason,
            sockets: [socket],
            closeSocket,
            sync: false,
        });
    }

    private async _emitRoomStats(): Promise<void> {
        const stats = getRoomStatsFromSessions(this._sessions.getLiveSessions());

        await this._publish({
            connectionId: null,
            data: stats,
            operator: null,
            type: "$roomStats",
            user: null,
        });
    }

    private async _emitSyncState(): Promise<void> {
        const connectionIds = await this._platform.persistence
            .getUsers(this._room.id)
            .then((map: Map<string, JsonObject | null>) => Object.keys(map));

        await this._publish({
            connectionId: null,
            data: { connectionIds },
            operator: null,
            type: "$syncStateReceived",
            user: null,
        });
    }

    private async _evictSockets(params: {
        code: number;
        reason: string;
        sockets: readonly AbstractWebSocket[];
    }): Promise<void> {
        const { code, reason, sockets } = params;
        const closing = sockets.filter((socket) => this._sessions.has(socket.sessionId));

        if (!closing.length) return;

        await this._unregisterSockets({
            code,
            reason,
            sockets: closing,
            closeSocket: true,
            sync: false,
        });
    }

    private _hydrate(): void {
        const webSockets = this._platform.getWebSockets() as readonly InferPlatformWebSocketSource<
            T["platform"]
        >[];

        webSockets.forEach((webSocket) => {
            const deserialized = this._platform.getSerializedState(webSocket);
            const sessionId = this._platform.getSessionId(webSocket);

            if (!deserialized) return;
            if (typeof sessionId !== "string") return;

            const pluvWs = this._platform.convertWebSocket(webSocket, { room: this._room.id });

            if (!pluvWs.user) return;

            this._sessions.set(sessionId, pluvWs);

            const session = pluvWs.session;

            this._sessions.addParticipantSession({
                id: session.user.id,
                kind: getSessionKind(session),
                sessionId,
            });
        });
    }

    private _isLiveSocket(socket: AbstractWebSocket, now = Date.now()): boolean {
        if (socket.state.quit) return false;

        const pingTime = this._platform.getLastPing(socket) ?? socket.state.timers.ping;

        return now - pingTime <= PING_TIMEOUT_MS;
    }

    private _noteStorage(effects: { storageDirty: boolean }): void {
        if (!effects.storageDirty) return;

        this.noteStorageDirty();
    }

    private async _onPublished(payload: IOPubSubEventMessage<any>): Promise<void> {
        const { options = {} as SendMessageOptions, ...message } = payload;
        const frame: RoomEffectFrame<T> = {
            connectionId: message.connectionId,
            data: message.data,
            operator: message.operator,
            type: message.type,
            user: message.user as RoomEffectFrame<T>["user"],
        };

        switch (options.type) {
            case "self": {
                await this._writeFrames([frame], "self");

                return;
            }
            case "broadcast": {
                const targets = options.sessionIds
                    ? options.sessionIds
                          .map((sessionId) => this._sessions.get(sessionId) ?? null)
                          .filter((socket): socket is AbstractWebSocket => !!socket)
                    : Array.from(this._sessions.all().values());

                await Promise.allSettled(
                    targets.map(async (socket) => {
                        await Promise.resolve(
                            socket.sendMessage({
                                ...frame,
                                room: this._room.id,
                            } as IOEventMessage<any>),
                        );
                    }),
                );

                return;
            }
            case undefined: {
                const targets = Array.from(this._sessions.all().values());

                await Promise.allSettled(
                    targets.map(async (socket) => {
                        await Promise.resolve(
                            socket.sendMessage({
                                ...frame,
                                room: this._room.id,
                            } as IOEventMessage<any>),
                        );
                    }),
                );

                return;
            }
            default:
                assertExhaustive(options);
        }
    }

    private _onSocketMessage(webSocket: WebSocketType<T["platform"]>) {
        return async (event: AbstractMessageEvent): Promise<void> => {
            const socket = this._sessions.resolve(webSocket);

            if (!socket) throw new Error("Could not get session");

            if (socket.state.quit) {
                await this._disconnect(socket, 1011, "WebSocket broken.", true);

                return;
            }

            const message = this._parseMessage(event);

            if (!message) return;

            const sessionEvent = this._sessionRouter.eventNames.has(message.type);

            if (!sessionEvent && !(await this._room["~"].whenReady())) return;

            if (sessionEvent) {
                if (message.type === "$initializeSession") {
                    await this._openSession(socket, message);

                    return;
                }

                await this._runSessionProcedure(socket, message);

                return;
            }

            await this._queue.finish<RoomEffects<T>>(
                async () => {
                    const effects = await this._room["~"].message(
                        this._toSnapshot(socket),
                        message,
                    );

                    if (isDeferredResult(effects))
                        return { pending: deferredResultPromise(effects) };

                    if (isSuspended(effects)) {
                        if ("error" in effects && isErrorMessage(effects.error)) {
                            socket.handleError({
                                error: new Error(effects.error.message),
                                room: this._room.id,
                                session: this._sessions.toSession(socket),
                            });
                        }

                        return { suspended: true as const };
                    }

                    return { value: effects };
                },
                (effects) => this._applyEffects(effects, socket),
            );
        };
    }

    private async _openSession(
        socket: AbstractWebSocket,
        message: EventMessage<string, any>,
    ): Promise<void> {
        const procedure = this._sessionRouter._defs.events.$initializeSession;
        const session = this._sessions.toSession(socket);

        try {
            const inputs = this._readInputs(procedure, message);
            const context = this._sessionContext(socket);
            const broadcast = await procedure.config.broadcast?.(inputs, context);

            await this._queue.join(async () => {
                const storage = await this._room["~"].initializeStorage({
                    input: inputs ?? {},
                    actor: this._toSnapshot(socket),
                });
                const { storageDirty, ...received } = storage;

                if (storageDirty) this.noteStorageDirty();

                await this._deliverRecord(
                    broadcast as Record<string, unknown> | null,
                    socket,
                    "broadcast",
                );
                await this._deliverRecord({ $storageReceived: received }, socket, "self");
            });
        } catch (error) {
            socket.handleError({ error, room: this._room.id, session });
        }
    }

    private _parseMessage(message: {
        data: string | ArrayBuffer;
    }): EventMessage<string, any> | null {
        try {
            const parsed = this._platform.parseData(message.data);

            if (typeof parsed !== "object") return null;
            if (typeof parsed.type !== "string") return null;
            if (typeof parsed.data !== "object") return null;

            return parsed as EventMessage<string, any>;
        } catch {
            return null;
        }
    }

    private async _publish(message: {
        connectionId: string | null;
        data: unknown;
        operator: RoomEffectFrame<T>["operator"];
        type: string;
        user: RoomEffectFrame<T>["user"];
        options?: SendMessageOptions;
    }): Promise<void> {
        if (typeof message.connectionId !== "string" && !isServerOriginEvent(message.type)) return;

        await this._platform.pubSub.publish(this._room.id, {
            ...message,
            room: this._room.id,
        } as IOPubSubEventMessage<any>);
    }

    private _readInputs(
        procedure: { config: { input?: any } } | null,
        message: EventMessage<string, any>,
    ): unknown {
        if (!procedure?.config.input) return message.data;

        return parsePluvSchema(procedure.config.input, message.data);
    }

    private async _removeSocket(socket: AbstractWebSocket): Promise<void> {
        const session = this._sessions.toSession(socket);
        const kind = getSessionKind(session);
        const participantId = session.user?.id;

        this._sessions.deleteConnection(socket.sessionId);

        if (participantId) {
            this._sessions.removeParticipantSession({
                id: participantId,
                kind,
                sessionId: socket.sessionId,
            });
        }

        await this._platform.persistence
            .deleteUser(this._room.id, socket.sessionId)
            .catch(() => null);
    }

    private async _runSessionProcedure(
        socket: AbstractWebSocket,
        message: EventMessage<string, any>,
    ): Promise<void> {
        const procedure =
            this._sessionRouter._defs.events[
                message.type as keyof (typeof this._sessionRouter)["_defs"]["events"]
            ];

        if (!procedure) return;

        const session = this._sessions.toSession(socket);
        let inputs: unknown;

        try {
            inputs = this._readInputs(procedure, message);
        } catch (error) {
            socket.handleError({ error, room: this._room.id, session });

            return;
        }

        try {
            const context = this._sessionContext(socket);
            const invoked = invokeProcedureResolvers({
                broadcast: () => procedure.config.broadcast?.(inputs, context),
                self: () => procedure.config.self?.(inputs, context),
            });

            if (!invoked.ok) {
                socket.handleError({ error: invoked.error, room: this._room.id, session });

                return;
            }

            const [broadcast, self] = await Promise.all([invoked.broadcast, invoked.self]);

            await this._deliverRecord(
                broadcast as Record<string, unknown> | null,
                socket,
                "broadcast",
            );
            await this._deliverRecord(self as Record<string, unknown> | null, socket, "self");
        } catch (error) {
            socket.handleError({ error, room: this._room.id, session });
        }
    }

    /** Sends procedure frames that `deliverFrames` did not. A failed send stays in this promise and retries after the checkpoint interval. */
    private async _deliverUnsent(): Promise<void> {
        while (this._unsent.length) {
            try {
                // oxlint-disable-next-line eslint/no-await-in-loop
                await this._queue.join(async () => {
                    const pending = this._unsent.slice();

                    for (const item of pending) {
                        const sender = item.effects.connectionId
                            ? (this._sessions.get(item.effects.connectionId) ?? null)
                            : null;

                        // oxlint-disable-next-line eslint/no-await-in-loop
                        await this._applyEffects(item.effects, sender);
                        this._unsent = this._unsent.filter((held) => held.id !== item.id);
                    }
                });
            } catch (error) {
                console.error(error);

                // oxlint-disable-next-line eslint/no-await-in-loop
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, STORAGE_CHECKPOINT_INTERVAL_MS);
                });
            }
        }
    }

    /** One promise. Wait, ask the room to copy, and repeat until the copy is clean. */
    private async _saveUntilClean(): Promise<void> {
        for (;;) {
            // oxlint-disable-next-line eslint/no-await-in-loop
            await new Promise<void>((resolve) => {
                setTimeout(resolve, STORAGE_CHECKPOINT_INTERVAL_MS);
            });

            try {
                // oxlint-disable-next-line eslint/no-await-in-loop
                const status = await this._queue.join(async () => {
                    const flushed = await this._room["~"].flushCheckpoint();

                    if (flushed.broadcast.length) {
                        await this._writeFrames(flushed.broadcast, "broadcast");
                        await this._room["~"].dropStorageUpdates(flushed.broadcast);
                    }

                    return flushed.status;
                });

                if (status === "closed") return;

                // oxlint-disable-next-line eslint/no-await-in-loop
                const stillDirty = status === "dirty" || (await this._room["~"].storageDirty());

                if (stillDirty) continue;
            } catch (error) {
                console.error(error);

                // oxlint-disable-next-line eslint/no-await-in-loop
                if (await this._room["~"].storageDirty()) continue;

                return;
            }

            // A write queued during the flush runs before the next macrotask.
            // oxlint-disable-next-line eslint/no-await-in-loop
            await Promise.resolve();
            // oxlint-disable-next-line eslint/no-await-in-loop
            if (await this._room["~"].storageDirty()) continue;

            return;
        }
    }

    private _sessionContext(socket: AbstractWebSocket): SessionEventContext<T> {
        const sessions = this._sessions;
        const session = sessions.toSession(socket);
        const time = new Date().getTime();

        return {
            connectionId: session.id,
            kind: getSessionKind(session),
            operator: getSessionOperator(session),
            platform: this._platform,
            get presence() {
                return (session.webSocket.state.presence ??
                    session.presence ??
                    null) as SessionEventContext<T>["presence"];
            },
            set presence(presence) {
                sessions.setPresence({
                    presence: (presence ?? null) as JsonObject | null,
                    sessionId: session.id,
                });
            },
            room: this._room.id,
            session,
            sessions: this._sessions.getLiveSessions(),
            time,
            user: session.user,
        };
    }

    private _toSnapshot(socket: AbstractWebSocket): RoomSessionSnapshot<T> {
        const session = this._sessions.toSession(socket);

        return {
            id: session.id,
            kind: getSessionKind(session),
            lastPing: this._platform.getLastPing(socket) ?? socket.state.timers.ping,
            operator: getSessionOperator(session),
            presence: session.presence,
            quit: socket.state.quit,
            seq: { presence: session.seq.presence },
            user: session.user,
        };
    }

    /**
     * Removes each socket on the queue, then runs `onUserDisconnected` after that
     * join so the listener can await the session manager. `$exit` is written on
     * a later join. Destroy waits until every unregister in progress has sent `$exit`.
     */
    private async _unregisterSockets(params: {
        code: number;
        reason: string;
        sockets: readonly AbstractWebSocket[];
        closeSocket: boolean;
        sync: boolean;
    }): Promise<void> {
        const { code, reason, sockets, closeSocket, sync } = params;

        if (!sockets.length) return;

        this._closing += 1;

        try {
            for (const socket of sockets) {
                // oxlint-disable-next-line eslint/no-await-in-loop
                const snapshot = await this._queue.join(async () => {
                    if (!this._sessions.has(socket.sessionId)) return null;

                    const next = this._toSnapshot(socket);

                    this._room["~"].logDebug(
                        `${colors.blue(`Unregistering connection for room ${this._room.id}:`)} ${next.id}`,
                    );
                    await this._removeSocket(socket);

                    return next;
                });

                if (!snapshot) continue;

                let effects: RoomEffects<T> | null = null;

                try {
                    // oxlint-disable-next-line eslint/no-await-in-loop
                    effects = await this._room["~"].close(snapshot);
                } finally {
                    if (closeSocket) socket.close(code, reason);
                }

                if (!effects) continue;

                const produced = effects;

                this._noteStorage(produced);

                // oxlint-disable-next-line eslint/no-await-in-loop
                await this._queue.join(async () => {
                    await this._writeFrames(produced.broadcast, "broadcast");
                    await this._room["~"].dropStorageUpdates(produced.broadcast);
                    this._room["~"].logDebug(
                        `${colors.blue(`Unregistered connection for room ${this._room.id}:`)} ${snapshot.id}`,
                    );
                });
            }
        } finally {
            this._closing -= 1;
            await this._queue.join(async () => {
                if (sync) await this._emitSyncState();

                await this._destroyEmptyRoom();

                if (this._sessions.getSize() === 0) this._roomStats.cancel();
                else this._roomStats.schedule();
            });
        }
    }

    private async _writeFrames(
        frames: readonly RoomEffectFrame<T>[],
        mode: "broadcast" | "self",
    ): Promise<void> {
        if (mode === "self") {
            await Promise.all(
                frames.map(async (frame) => {
                    const socket = frame.connectionId
                        ? (this._sessions.get(frame.connectionId) ?? null)
                        : null;

                    if (!socket) return;

                    await Promise.resolve(
                        socket.sendMessage({
                            ...frame,
                            room: this._room.id,
                        } as IOEventMessage<any>),
                    );

                    if (frame.type === "$pong") await this._collectPong();
                }),
            );

            return;
        }

        await Promise.allSettled(
            Array.from(this._sessions.all().values()).flatMap((socket) =>
                frames.map((frame) =>
                    Promise.resolve(
                        socket.sendMessage({
                            ...frame,
                            room: this._room.id,
                        } as IOEventMessage<any>),
                    ),
                ),
            ),
        );
    }
}

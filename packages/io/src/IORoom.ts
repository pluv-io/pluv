import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOEventRecord,
    CrdtDocLike,
    EventMessage,
    IOEventMessage,
    IOLike,
    Id,
    InferEventMessage,
    InferEventsInput,
    InferEventsOutput,
    InferIOInput,
    InferTreatyUser,
    JsonObject,
    ListUsersOptions,
    ListUsersResult,
    Maybe,
} from "@pluv/types";
import colors from "kleur";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferPlatformWebSocketSource,
    InferRoomContextType,
} from "./AbstractPlatform";
import type { IOPubSubEventMessage } from "./AbstractPubSub";
import type {
    AbstractCloseEvent,
    AbstractErrorEvent,
    AbstractMessageEvent,
} from "./AbstractWebSocket";
import { AbstractWebSocket } from "./AbstractWebSocket";
import type { IODefs, IOLikeFromDefs } from "./IODefs";
import type { PluvRouter } from "./PluvRouter";
import { RoomSessions } from "./RoomSessions";
import { RoomStorage } from "./RoomStorage";
import { authorize } from "./authorize";
import {
    GARBAGE_COLLECT_INTERVAL_MS,
    ROOM_STATS_THROTTLE_MS,
    isServerOriginEvent,
} from "./constants";
import type {
    EventResolverContext,
    GetInitialStorageFn,
    IORoomDestroyedEvent,
    IORoomListenerEvent,
    IORoomMessageEvent,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
    PluvContext,
    PluvIOLimits,
    PluvIOSecret,
    SendMessageOptions,
    WebSocketSession,
    WebSocketType,
} from "./types";
import {
    getRoomStatsFromSessions,
    oneLine,
    pageLiveUsers,
    parsePluvSchema,
    resolveIOSecret,
    resolveMaxConnections,
    throttle,
} from "./utils";
import type { Throttle } from "./utils";

type BroadcastMessage<T extends IODefs> =
    | InferEventMessage<InferEventsInput<T["events"]>>
    | InferEventMessage<BaseIOEventRecord<{ user: T["treaty"]["user"] }>>;

interface BroadcastParams<T extends IODefs> {
    message: BroadcastMessage<T>;
    senderId?: string;
    /**
     * Envelope user when the sender session is already gone (e.g. `$exit`).
     */
    senderUser?: InferTreatyUser<T["treaty"]> | null;
}

export interface IORoomListeners<T extends IODefs = IODefs> {
    onRoomDestroyed: (event: IORoomDestroyedEvent<T>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<T>) => void;
    onMessage: (event: IORoomMessageEvent<T>) => void;
    onUserConnected: (event: IOUserConnectedEvent<T>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<T>) => void;
}

type IORoomThrottles = {
    roomStats: Throttle;
};

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

export type IORoomConfig<T extends IODefs = IODefs> = Partial<IORoomListeners<T>> & {
    context: PluvContext<T["platform"], T["context"]>;
    debug: boolean;
    getInitialStorage: GetInitialStorageFn<T["context"]>;
    limits: PluvIOLimits;
    platform: T["platform"];
    roomContext: InferRoomContextType<T["platform"]>;
    router: PluvRouter<T>;
    secret?: PluvIOSecret<T["platform"]>;
    treaty: T["treaty"];
};

interface SendMessageSender {
    sessionId: string | null;
    user: JsonObject | null;
}

export type WebSocketRegisterConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
> = {
    token?: string | null;
} & InferInitContextType<TPlatform>;

export class IORoom<T extends IODefs = IODefs> implements IOLike<IOLikeFromDefs<T>> {
    public readonly id: string;

    private _lastGarbageCollectMs: number = -1 * (GARBAGE_COLLECT_INTERVAL_MS + 1);
    private _registering = 0;
    private _teardown: Promise<void> | null = null;
    private _uninitialize: Promise<() => Promise<void>> | null = null;

    private readonly _context: PluvContext<T["platform"], T["context"]>;
    private readonly _debug: boolean;
    private readonly _limits: PluvIOLimits;
    private readonly _listeners: IORoomListeners<T>;
    private readonly _platform: T["platform"];
    private readonly _roomContext: InferRoomContextType<T["platform"]>;
    private readonly _router: PluvRouter<T>;
    private readonly _secret?: PluvIOSecret<T["platform"]>;
    private readonly _sessions: RoomSessions<T>;
    private readonly _storage: RoomStorage<T>;
    private readonly _throttles: IORoomThrottles;
    private readonly _treaty: T["treaty"];

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            context: this._context,
            events: this._router._defs.events,
            platform: this._platform,
            treaty: this._treaty,
        } as {
            context: T["context"];
            events: T["events"];
            platform: T["platform"];
            treaty: T["treaty"];
        };
    }

    public get broadcast(): BroadcastProxy<this> {
        const _broadcast = <TEvent extends keyof InferIOInput<this>>(
            event: TEvent,
            data: Id<InferIOInput<this>[TEvent]>,
            senderId: string,
        ): Promise<void> => {
            if (typeof senderId !== "string") {
                throw new Error("room.broadcast of a user event requires a senderId");
            }

            const message = { type: event, data } as BroadcastMessage<T>;

            return Promise.resolve(this._broadcast({ message, senderId }));
        };

        return new Proxy(_broadcast, {
            get(fn, prop) {
                return (data: any, senderId: string) => fn(prop as any, data, senderId);
            },
        }) as BroadcastProxy<this>;
    }

    private get _initialized(): Promise<boolean> {
        if (!this._uninitialize) return Promise.resolve(false);
        return this._uninitialize.then(() => true);
    }

    constructor(id: string, config: IORoomConfig<T>) {
        const {
            _meta,
            context,
            debug,
            getInitialStorage,
            limits,
            onRoomDestroyed,
            onStorageDestroyed,
            onMessage,
            onUserConnected,
            onUserDisconnected,
            platform,
            roomContext,
            router,
            secret,
            treaty,
        } = config as IORoomConfig<T> & { _meta?: any };

        this.id = id;

        this._context = context;
        this._debug = debug;
        this._limits = limits;
        this._roomContext = roomContext;
        this._router = router;
        this._secret = secret;
        this._treaty = treaty;
        this._platform = platform.initialize({ ...(!!_meta ? { _meta } : {}), roomContext });
        this._sessions = new RoomSessions({ platform: this._platform });
        this._storage = new RoomStorage({
            docFactory:
                (treaty.storage as AbstractCrdtDocFactory<any, any> | undefined) ?? noop.doc(),
            getContext: () => this._getContext(),
            getInitialStorage,
            platform: this._platform,
            room: this.id,
        });

        // Listeners are provided from server-level configuration via createRoom
        this._listeners = {
            onRoomDestroyed: (event) => onRoomDestroyed?.(event),
            onStorageDestroyed: (event) => onStorageDestroyed?.(event),
            onMessage: (event) => onMessage?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        };
        this._throttles = {
            roomStats: throttle(() => this._emitRoomStats(), {
                wait: ROOM_STATS_THROTTLE_MS,
            }),
        };

        /**
         * @description Everything below this line relates to waking up from hibernation.
         * @see https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-hibernation-api
         * @date April 17, 2025
         */
        const webSockets = this._platform.getWebSockets() as readonly InferPlatformWebSocketSource<
            T["platform"]
        >[];

        webSockets.forEach((webSocket) => {
            const deserialized = this._platform.getSerializedState(webSocket);
            const sessionId = this._platform.getSessionId(webSocket);

            if (!deserialized) return;
            if (typeof sessionId !== "string") return;

            const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

            this._sessions.set(sessionId, pluvWs);

            const userId = pluvWs.user?.id;

            if (!!userId) this._sessions.addUserSession(userId, sessionId);
        });

        this._initialize();
    }

    private get _doc(): Promise<CrdtDocLike<any, any>> {
        if (!this._uninitialize) return this._storage.doc;

        return this._uninitialize.then(() => this._storage.doc);
    }

    /**
     * @description Closes a connection with the specified sessionId
     * @param sessionId The session id of the connection to close
     */
    public async evict(sessionId: string): Promise<void> {
        const session = this._sessions.get(sessionId);

        if (session) session.state.quit = true;

        await this._emitQuitters();
    }

    /**
     * @description Closes all connections to this room, effectively destroying
     * the room
     */
    public async evictAll(): Promise<void> {
        const sessions = Array.from(this._sessions.values());

        sessions.forEach((session) => {
            session.state.quit = true;
        });

        await this._emitQuitters();
    }

    /**
     * @description The IORoom will garbage collect occasionally as connections ping/pong the
     * server
     */
    public async garbageCollect(): Promise<void> {
        this._lastGarbageCollectMs = Date.now();

        await Promise.all([this._emitQuitters(), this._emitSyncState()]);
    }

    public getSize(): number {
        return this._sessions.getSize();
    }

    public listUsers(options: ListUsersOptions = {}): ListUsersResult<this> {
        return pageLiveUsers(this._sessions.getLiveSessions(), options) as ListUsersResult<this>;
    }

    public onClose(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractCloseEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._sessions.resolve(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onError(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractErrorEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._sessions.resolve(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onMessage(
        webSocket: WebSocketType<T["platform"]>,
    ): (event: AbstractMessageEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._sessions.resolve(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onMessage(wsSession);
    }

    public async register(
        webSocket: InferPlatformWebSocketSource<T["platform"]>,
        ...options: keyof InferInitContextType<T["platform"]> extends never
            ? [{ token?: string }?]
            : [WebSocketRegisterConfig<T["platform"]>]
    ): Promise<void> {
        const _options = (options[0] ?? {}) as WebSocketRegisterConfig<T["platform"]>;
        const { token: tokenOption, ...initRest } = _options as WebSocketRegisterConfig<
            T["platform"]
        > & { token?: string | null };
        const token = tokenOption ?? null;
        const registerConfig = {
            ...this._platform.normalizeInitContext(initRest as InferInitContextType<T["platform"]>),
            token,
        } as WebSocketRegisterConfig<T["platform"]>;

        /**
         * TODO
         * @description Update the sessionId strategy so that the userId can be used to retrieve
         * the session in O(1) time if authorized.
         * @date April 15, 2025
         */
        const sessionId = this._platform.getSessionId(webSocket);
        const sessionExists = typeof sessionId === "string" && this._sessions.has(sessionId);

        if (sessionExists) return;

        const maxConnections = resolveMaxConnections(this._limits);
        const rejectMaxConnections = (): void => {
            const rejected = this._platform.convertWebSocket(webSocket, { room: this.id });

            rejected.handleError({
                error: new Error(`Room is at maxConnections (${maxConnections.toLocaleString()}).`),
                room: this.id,
            });
            rejected.close(4000, "Room is at maxConnections");
        };

        if (this.getSize() + this._registering >= maxConnections) {
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

        try {
            // Joining an in-flight teardown lets the room re-initialize from storage below, rather
            // than binding this connection to the doc that teardown discards.
            if (this._teardown) await this._teardown;

            if (!(await this._initialized)) {
                this._initialize();
                await this._initialized;
            }

            const user = await this._getAuthorizedUser(token, registerConfig);
            const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

            if (!user) {
                this._logDebug(colors.blue("Authorization failed for connection"));
                pluvWs.handleError({ error: new Error("Not authorized"), room: this.id });
                pluvWs.close(3000, "WebSocket unauthorized.");

                return;
            }

            const latest = this._sessions.getLatestPresence(user.id);
            const prevState = pluvWs.state;

            pluvWs.user = user;

            this._platform.setSerializedState(pluvWs, {
                ...prevState,
                presence: latest.presence,
                seq: { ...prevState.seq, presence: latest.seq },
            });
            this._sessions.addUserSession(user.id, pluvWs.sessionId);

            this._logDebug(
                `${colors.blue(`Registering connection for room ${this.id}:`)} ${pluvWs.sessionId}`,
            );

            await this._platform.acceptWebSocket(pluvWs);
            this._sessions.set(pluvWs.sessionId, pluvWs);
            releaseReservation();
            await this._platform.persistence.addUser(this.id, pluvWs.sessionId, user);

            if (this._platform._config.registrationMode === "attached") {
                const onClose = this._onClose(pluvWs).bind(this);
                const onMessage = this._onMessage(pluvWs).bind(this);

                pluvWs.addEventListener("close", onClose);
                pluvWs.addEventListener("error", onClose);
                pluvWs.addEventListener("message", onMessage);
            }

            await this._emitRegistered(pluvWs);
            this._throttles.roomStats.schedule();

            const size = this.getSize();

            this._logDebug(oneLine`
                ${colors.blue(`Registered connection for room ${this.id}:`)}
                ${pluvWs.sessionId}
            `);
            this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);
        } finally {
            releaseReservation();
        }
    }

    private async _broadcast(params: BroadcastParams<T>): Promise<void> {
        const { message, senderId, senderUser } = params;
        const type = (message as { type: string }).type;

        if (typeof senderId !== "string" && !isServerOriginEvent(type)) return;

        const sender = senderId ? (this._sessions.get(senderId) ?? null) : null;
        const session = sender?.session ?? null;
        const user = senderUser ?? session?.user ?? null;

        await this._platform.pubSub.publish(this.id, {
            connectionId: senderId ?? null,
            room: this.id,
            user,
            ...message,
        } as IOPubSubEventMessage<any>);
    }

    private async _closeWebSockets(webSockets: readonly AbstractWebSocket[]): Promise<void> {
        const closeWebSocket = async (webSocket: AbstractWebSocket): Promise<void> => {
            const sessionId = webSocket.sessionId;
            const deleted = this._sessions.deleteConnection(sessionId);

            if (!deleted) return;

            const session = this._sessions.toSession(deleted);
            const user = session.user;

            this._logDebug(
                `${colors.blue(`Unregistering connection for room ${this.id}:`)} ${sessionId}`,
            );

            await this._platform.persistence.deleteUser(this.id, sessionId).catch(() => null);
            await this._broadcast({
                message: {
                    type: "$exit",
                    data: {
                        sessionId,
                        user,
                    },
                } as BroadcastMessage<T>,
                senderId: sessionId,
                senderUser: user,
            });
            this._throttles.roomStats.schedule();

            if (!!user) this._sessions.removeUserSession(user.id, sessionId);

            try {
                const [doc, context] = await Promise.all([this._doc, this._getContext()]);
                const encodedState = doc.getEncodedState();

                await Promise.resolve(
                    this._listeners.onUserDisconnected({
                        context,
                        encodedState,
                        platform: this._platform,
                        room: this.id,
                        user,
                    }),
                );
            } catch (error) {
                console.error(error);
            }

            this._logDebug(
                `${colors.blue(`Unregistered connection for room ${this.id}:`)} ${deleted.sessionId}`,
            );
        };

        const promises = webSockets.map(async (webSocket) => {
            await closeWebSocket(webSocket).catch(() => null);
        });

        await Promise.all(promises).catch(() => null);

        const size = this.getSize();

        this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);

        if (!!size) return;
        if (!this._uninitialize) return;

        const uninitialize = (await this._uninitialize).bind(this);
        await uninitialize();
    }

    private async _emitQuitters(): Promise<void> {
        await this._closeWebSockets(this._sessions.getQuitters());
    }

    private async _emitRegistered(pluvWs: AbstractWebSocket): Promise<void> {
        const session = this._sessions.toSession(pluvWs);
        const sessionId = session.id;
        const presence = session.presence;
        const user = session.user;

        const [doc, context] = await Promise.all([this._doc, this._getContext()]);
        const encodedState = doc.isEmpty() ? null : doc.getEncodedState();
        const stats = getRoomStatsFromSessions(this._sessions.getLiveSessions());

        await this._sendSelfMessage(
            {
                type: "$registered",
                data: {
                    connectionCount: stats.connectionCount,
                    presence,
                    sessionId,
                    state: encodedState,
                    seq: { presence: session.seq.presence },
                    userCount: stats.userCount,
                },
            },
            { sessionId, user },
        );

        try {
            await Promise.resolve(
                this._listeners.onUserConnected({
                    context,
                    encodedState,
                    platform: this._platform,
                    room: this.id,
                    user,
                    webSocket: pluvWs.webSocket,
                }),
            );
        } catch (err) {
            console.error(err);
        }
    }

    private async _emitRoomStats(): Promise<void> {
        const stats = getRoomStatsFromSessions(this._sessions.getLiveSessions());

        await this._broadcast({
            message: { type: "$roomStats", data: stats },
        });
    }

    private async _emitSyncState(): Promise<void> {
        const connectionIds = await this._platform.persistence
            .getUsers(this.id)
            .then((map: Map<string, JsonObject | null>) => Object.keys(map));

        await this._broadcast({
            message: {
                type: "$syncStateReceived",
                data: { connectionIds },
            },
        });
    }

    private _ensureDetached(): void {
        if (this._platform._config.registrationMode === "detached") return;

        throw new Error("Platform must use detached mode");
    }

    /**
     * TODO
     * @description Revisit any cast types
     * @date July 17, 2025
     */
    private async _getAuthorizedUser(
        token: Maybe<string>,
        options: WebSocketRegisterConfig<T["platform"]>,
    ): Promise<InferTreatyUser<T["treaty"]> | null> {
        const secret = resolveIOSecret(this._secret, options);

        if (!token) return null;

        if (!secret) throw new Error("`secret` was not provided");

        const payload = await authorize({
            platform: this._platform,
            secret,
        }).decode(token);

        if (!payload) {
            this._logDebug(colors.blue("Could not decode token:"));
            this._logDebug(token);

            return null;
        }

        if (payload.room !== this.id) {
            this._logDebug(colors.blue(`Token is not authorized for room ${this.id}:`));
            this._logDebug(colors.blue("Received:"), payload.room);
            this._logDebug(token);

            return null;
        }

        try {
            return parsePluvSchema(this._treaty.user, payload.user) as InferTreatyUser<T["treaty"]>;
        } catch {
            this._logDebug(`${colors.blue("Token fails validation:")} ${token}`);

            return null;
        }
    }

    private async _getContext(): Promise<T["context"]> {
        const context = this._context as PluvContext<T["platform"], T["context"]>;

        if (typeof context === "function") {
            return await Promise.resolve(context(this._roomContext));
        }

        return await Promise.resolve(context);
    }

    private _createEventResolverContext(params: {
        context: T["context"];
        doc: CrdtDocLike<any, any>;
        session: WebSocketSession<T>;
        sessions: readonly WebSocketSession<T>[];
    }): EventResolverContext<T> {
        const { context, doc, session, sessions } = params;
        const roomSessions = this._sessions;
        const storage = this._storage;
        const time = new Date().getTime();

        return {
            context,
            doc,
            garbageCollect: async () => {
                await this.garbageCollect();
            },
            platform: this._platform,
            get presence() {
                return (session.webSocket.state.presence ??
                    session.presence ??
                    null) as JsonObject | null;
            },
            set presence(presence: JsonObject | null) {
                roomSessions.setPresence({ presence, sessionId: session.id });
            },
            room: this.id,
            session,
            sessions,
            get storageSeeded() {
                return storage.storageSeeded;
            },
            set storageSeeded(value: boolean) {
                storage.storageSeeded = value;
            },
            time,
        } as EventResolverContext<T>;
    }

    private _getProcedure(
        message: EventMessage<string, any>,
    ):
        | (typeof this._router)["_defs"]["events"][keyof (typeof this._router)["_defs"]["events"]]
        | null {
        return (
            this._router._defs.events[
                message.type as keyof (typeof this._router)["_defs"]["events"]
            ] ?? null
        );
    }

    private _getProcedureInputs(
        message: EventMessage<string, any>,
    ): InferIOInput<this>[keyof T["events"]] {
        const procedure = this._getProcedure(message);

        if (!procedure) return message.data;

        return procedure.config.input
            ? parsePluvSchema(procedure.config.input, message.data)
            : message.data;
    }

    private _initialize() {
        const promise = (async () => {
            this._logDebug(colors.blue(`Initializing room: ${this.id}`));

            if (!!this._uninitialize) {
                const uninitialize = (await this._uninitialize).bind(this);
                await uninitialize();

                this._uninitialize = null;
            }

            const pubSubId = await this._platform.pubSub.subscribe(
                this.id,
                async ({ options = {} as SendMessageOptions, ...message }): Promise<void> => {
                    await promise;

                    const sender: SendMessageSender = {
                        sessionId: message.connectionId,
                        user: message.user,
                    };

                    switch (options.type) {
                        case "self": {
                            await this._sendSelfMessage(message, sender);
                            return;
                        }
                        case "broadcast":
                        default: {
                            const sessionIds = options.sessionIds;

                            await this._sendBroadcastMessage(message, sender, sessionIds);
                        }
                    }
                },
            );

            await this._storage.initialize();

            const uninitialize = async (): Promise<void> => {
                // Teardown clears the doc partway through, so re-entering would persist that
                // cleared doc over the room's real content.
                if (this._teardown) return this._teardown;

                this._teardown = (async () => {
                    Object.values(this._throttles).forEach((item) => {
                        item.cancel();
                    });

                    this._platform.pubSub.unsubscribe(pubSubId);

                    const context = await this._getContext();
                    const { encodedState, refusedEmptyPersist, shouldDestroyStorage } =
                        await this._storage.destroy();

                    if (refusedEmptyPersist) {
                        this._logDebug(
                            colors.blue(
                                `Refusing to persist an unwritten document for room: ${this.id}`,
                            ),
                        );
                    }

                    // Always emit onRoomDestroyed
                    await Promise.resolve(
                        this._listeners.onRoomDestroyed({
                            ...("_meta" in this._platform && !!this._platform._meta
                                ? { _meta: this._platform._meta }
                                : {}),
                            context,
                            platform: this._platform,
                            room: this.id,
                        }),
                    );

                    if (shouldDestroyStorage) {
                        await Promise.resolve(
                            this._listeners.onStorageDestroyed({
                                ...("_meta" in this._platform && !!this._platform._meta
                                    ? { _meta: this._platform._meta }
                                    : {}),
                                context,
                                encodedState,
                                platform: this._platform,
                                room: this.id,
                            }),
                        );
                    }

                    this._uninitialize = null;
                })();

                try {
                    await this._teardown;
                } finally {
                    this._teardown = null;
                }
            };

            return { uninitialize };
        })();

        this._uninitialize = promise.then((result) => result.uninitialize);
    }

    private _logDebug(...data: any[]): void {
        if (this._debug) console.log(...data);
    }

    private _onClose(webSocket: AbstractWebSocket): () => Promise<void> {
        return async (): Promise<void> => {
            if (!(await this._initialized)) return;
            await this._closeWebSockets([webSocket]);
        };
    }

    private _onMessage(
        webSocket: AbstractWebSocket,
    ): (event: AbstractMessageEvent) => Promise<void> {
        return async (event: AbstractMessageEvent): Promise<void> => {
            if (!(await this._initialized)) return;

            const pluvWs = this._sessions.resolve(webSocket as WebSocketType<T["platform"]>);

            if (!pluvWs) throw new Error("Could not get session");

            const session = this._sessions.getSession(pluvWs as WebSocketType<T["platform"]>);
            const sessions = this._sessions.getLiveSessions();
            const [doc, context] = await Promise.all([this._doc, this._getContext()]);
            const eventContext = this._createEventResolverContext({
                context,
                doc,
                session,
                sessions,
            });

            if (pluvWs.state.quit) {
                await this._closeWebSockets([pluvWs]).catch(() => null);
                pluvWs.close(1011, "WebSocket broken.");

                return;
            }

            const message = this._parseMessage(event);

            if (!message) return;

            const procedure = this._getProcedure(message);

            this._listeners.onMessage({
                ...("_meta" in this._platform && !!this._platform._meta
                    ? { _meta: this._platform._meta }
                    : {}),
                context,
                encodedState: doc.getEncodedState(),
                message: message as InferEventMessage<
                    InferEventsOutput<T["events"]>,
                    keyof InferEventsOutput<T["events"]>
                >,
                platform: this._platform,
                room: this.id,
                user: session.user,
                webSocket: session.webSocket.webSocket,
            });

            const sessionId = session.id;
            const user = session.user;

            if (!procedure) {
                if (message.type.startsWith("$")) return;

                // Unknown event types are broadcast on purpose so client-only
                // MergeEvents procedures can still relay through the room.
                await this._broadcast({
                    message: message as any,
                    senderId: sessionId,
                });

                return;
            }

            let inputs: InferIOInput<this>[keyof T["events"]];

            try {
                inputs = this._getProcedureInputs(message);
            } catch (error) {
                pluvWs.handleError({
                    error,
                    message: "Invalid input",
                    room: this.id,
                    session,
                });

                return;
            }

            try {
                // broadcast and self resolvers run concurrently and may
                // race on shared doc / presence state — do not assume ordering.
                const [broadcast, self] = await Promise.all([
                    procedure.config.broadcast?.(inputs, eventContext),
                    procedure.config.self?.(inputs, eventContext),
                ]);

                const handleBroadcast = async () => {
                    if (!broadcast) return;

                    const messages = Object.entries(broadcast).map(async ([type, data]: any) => {
                        await this._broadcast({
                            message: { data, type },
                            senderId: sessionId,
                        });
                    });

                    await Promise.all(messages);
                };

                const handleSelf = async () => {
                    if (!self) return;

                    const messages = Object.entries(self).map(async ([type, data]) => {
                        await this._sendSelfMessage({ data, type }, { sessionId, user });
                    });

                    await Promise.all(messages);
                };

                await Promise.all([handleBroadcast(), handleSelf()]);
            } catch (error) {
                pluvWs.handleError({
                    error,
                    room: this.id,
                    session,
                });
            }
        };
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

    private async _sendMessage(
        pluvWs: AbstractWebSocket,
        message: IOEventMessage<any>,
    ): Promise<void> {
        if (!(await this._initialized)) return;

        await Promise.resolve(pluvWs.sendMessage(message));
    }

    private async _sendBroadcastMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
        sessionIds?: readonly string[],
    ): Promise<void> {
        const { data, type } = message;
        const connectionId = sender?.sessionId ?? null;
        const room = this.id;

        if (typeof connectionId !== "string" && !isServerOriginEvent(type)) return;

        const webSockets =
            sessionIds?.reduce((dict, id) => {
                const pluvWs = this._sessions.get(id);

                return pluvWs ? dict.set(id, pluvWs) : dict;
            }, new Map<string, AbstractWebSocket>()) ?? this._sessions.all();

        await Promise.allSettled(
            Array.from(webSockets.values()).map(async (pluvWs) => {
                await this._sendMessage(pluvWs, {
                    connectionId,
                    data,
                    room,
                    type,
                    user: sender?.user ?? null,
                } as IOEventMessage<any>);
            }),
        );
    }

    private async _sendSelfMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
    ): Promise<void> {
        const senderId = sender?.sessionId ?? null;

        if (typeof senderId !== "string") return;

        const pluvWs = this._sessions.get(senderId);

        if (!pluvWs) return;

        const session = pluvWs.session;
        const user = session.user;

        await this._sendMessage(pluvWs, {
            connectionId: senderId,
            room: this.id,
            user,
            ...message,
        });

        /**
         * @description Note that this will not fire for Cloudflare's hibernatable websockets
         * because the server will auto-respond with the $pong event without calling any
         * functions.
         * @date April 18, 2025
         */
        if (message.type === "$pong") {
            const elapsedMs = Date.now() - this._lastGarbageCollectMs;

            /**
             * @description Garbage collection is awaited after responding, since it can close
             * websockets and flush persistence. Blocking the $pong response on it risks
             * exceeding the client's pong timeout and triggering a spurious reconnect.
             */
            if (elapsedMs > GARBAGE_COLLECT_INTERVAL_MS) {
                await this.garbageCollect();
            }
        }
    }
}

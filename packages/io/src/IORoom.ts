import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOEventRecord,
    BaseUser,
    CrdtDocLike,
    CrdtLibraryType,
    EventMessage,
    IOEventMessage,
    IOLike,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    JsonObject,
    Maybe,
} from "@pluv/types";
import colors from "kleur";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferPlatformWebSocketSource,
    InferRoomContextType,
} from "./AbstractPlatform";
import type {
    AbstractCloseEvent,
    AbstractErrorEvent,
    AbstractMessageEvent,
} from "./AbstractWebSocket";
import { AbstractWebSocket } from "./AbstractWebSocket";
import type { PluvRouter, PluvRouterEventConfig } from "./PluvRouter";
import { authorize } from "./authorize";
import { GARBAGE_COLLECT_INTERVAL_MS, PING_TIMEOUT_MS } from "./constants";
import type {
    EventResolverContext,
    EventResolverKind,
    GetInitialStorageFn,
    IORoomDestroyedEvent,
    IORoomListenerEvent,
    IORoomMessageEvent,
    IOUserConnectedEvent,
    IOUserDisconnectedEvent,
    PluvContext,
    PluvIOAuthorize,
    ResolvedPluvIOAuthorize,
    WebSocketSession,
    WebSocketType,
} from "./types";
import { oneLine } from "./utils";

type BroadcastMessage<TIO extends IORoom<any, any, any, any, any>> =
    | InferEventMessage<InferIOInput<TIO>>
    | InferEventMessage<BaseIOEventRecord<InferIOAuthorize<TIO>>>;

interface BroadcastParams<TIO extends IORoom<any, any, any, any, any>> {
    message: BroadcastMessage<TIO>;
    senderId?: string;
}

export interface IORoomListeners<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> {
    // DEPRECATED_ONDESTROY:
    /**
     * @deprecated Use `onRoomDestroyed` and `onStorageDestroyed` instead. This callback will be removed in a future version.
     */
    onDestroy?: (event: IORoomListenerEvent<TPlatform, TContext>) => void | Promise<void>;
    onRoomDestroyed: (event: IORoomDestroyedEvent<TPlatform, TContext>) => void;
    onStorageDestroyed: (event: IORoomListenerEvent<TPlatform, TContext>) => void;
    onMessage: (event: IORoomMessageEvent<TPlatform, TAuthorize, TContext, TEvents>) => void;
    onUserConnected: (event: IOUserConnectedEvent<TPlatform, TAuthorize, TContext>) => void;
    onUserDisconnected: (event: IOUserDisconnectedEvent<TPlatform, TAuthorize, TContext>) => void;
}

export type BroadcastProxy<TIO extends IORoom<any, any, any, any, any>> = (<
    TEvent extends keyof InferIOInput<TIO>,
>(
    event: TEvent,
    data: Id<InferIOInput<TIO>[TEvent]>,
) => Promise<void>) & {
    [event in keyof InferIOInput<TIO>]: (data: Id<InferIOInput<TIO>>[event]) => Promise<void>;
};

export type IORoomConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null =
        any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context: PluvContext<TPlatform, TContext>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any, any> };
    debug: boolean;
    getInitialStorage: GetInitialStorageFn<TContext>;
    platform: TPlatform;
    roomContext: InferRoomContextType<TPlatform>;
    router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

interface SendMessageSender {
    sessionId: string | null;
    user: JsonObject | null;
}

interface PatchPresenceParams {
    presence: JsonObject | null;
    sessionId: string;
    timer?: number | null;
}

export type WebSocketRegisterConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
> = {
    token?: string | null;
} & InferInitContextType<TPlatform>;

export class IORoom<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null =
        null,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TCrdt, TEvents> {
    public readonly id: string;

    private _doc: Promise<CrdtDocLike<any, any>>;
    private _lastGarbageCollectMs: number = -1 * (GARBAGE_COLLECT_INTERVAL_MS + 1);
    private _uninitialize: Promise<() => Promise<void>> | null = null;

    private readonly _authorize: TAuthorize = null as TAuthorize;
    private readonly _context: PluvContext<TPlatform, TContext>;
    private readonly _crdt: TCrdt;
    private readonly _debug: boolean;
    private readonly _docFactory: AbstractCrdtDocFactory<any, any>;
    private readonly _getInitialStorage: GetInitialStorageFn<TContext>;
    private readonly _listeners: IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>;
    private readonly _platform: TPlatform;
    private readonly _roomContext: InferRoomContextType<TPlatform>;
    private readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
    private readonly _sessions = new Map<
        [sessionId: string][0],
        AbstractWebSocket<any, TAuthorize>
    >();
    private readonly _userSessionss = new Map<[userId: string][0], Set<[sessionId: string][0]>>();

    private _wasDocEmptyOnInit: boolean = true;
    private _storageInitializedViaSession: boolean = false;

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            authorize: this._authorize,
            context: this._context,
            crdt: this._crdt,
            events: this._router._defs.events,
            platform: this._platform,
        } as {
            authorize: TAuthorize;
            context: TContext;
            crdt: TCrdt;
            events: TEvents;
            platform: TPlatform;
        };
    }

    public get broadcast(): BroadcastProxy<this> {
        const _broadcast = <TEvent extends keyof InferIOInput<this>>(
            event: TEvent,
            data: Id<InferIOInput<this>[TEvent]>,
        ): Promise<void> => {
            const message = { type: event, data } as BroadcastMessage<this>;

            return Promise.resolve(this._broadcast({ message }));
        };

        return new Proxy(_broadcast, {
            get(fn, prop) {
                return (data: any) => fn(prop as any, data);
            },
        }) as BroadcastProxy<this>;
    }

    private get _initialized(): Promise<boolean> {
        return Promise.resolve(!!this._uninitialize?.then((result) => !!result));
    }

    constructor(id: string, config: IORoomConfig<TPlatform, TAuthorize, TContext, TEvents>) {
        const {
            _meta,
            authorize,
            context,
            crdt = noop,
            debug,
            getInitialStorage,
            // DEPRECATED_ONDESTROY:
            onDestroy,
            onRoomDestroyed,
            onStorageDestroyed,
            onMessage,
            onUserConnected,
            onUserDisconnected,
            platform,
            roomContext,
            router,
        } = config as IORoomConfig<TPlatform, TAuthorize, TContext, TEvents> & { _meta?: any };

        // DEPRECATED_ONDESTROY:
        if (onDestroy) {
            console.warn(
                "onDestroy is deprecated. Use onRoomDestroyed and onStorageDestroyed instead. See migration guide for details.",
            );
            if (onRoomDestroyed) {
                console.warn(
                    "Both onDestroy and onRoomDestroyed are provided. onDestroy will still fire for backward compatibility, but consider migrating to onRoomDestroyed.",
                );
            }
        }

        this.id = id;

        this._context = context;
        this._crdt = crdt as TCrdt;
        this._debug = debug;
        this._docFactory = crdt.doc(() => ({}));
        this._getInitialStorage = getInitialStorage;
        this._roomContext = roomContext;
        this._router = router;
        this._platform = platform.initialize({ ...(!!_meta ? { _meta } : {}), roomContext });

        // DEPRECATED_ONDESTROY:
        this._listeners = {
            onDestroy: onDestroy ? (event) => onDestroy(event) : undefined,
            onRoomDestroyed: (event) => onRoomDestroyed?.(event),
            onStorageDestroyed: (event) => onStorageDestroyed?.(event),
            onMessage: (event) => onMessage?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        };

        if (authorize) this._authorize = authorize;

        /**
         * @description Everything below this line relates to waking up from hibernation.
         * @see https://developers.cloudflare.com/durable-objects/best-practices/websockets/#websocket-hibernation-api
         * @date April 17, 2025
         */
        const webSockets =
            this._platform.getWebSockets() as readonly InferPlatformWebSocketSource<TPlatform>[];

        webSockets.forEach((webSocket) => {
            const deserialized = this._platform.getSerializedState(webSocket);
            const sessionId = this._platform.getSessionId(webSocket);

            if (!deserialized) return;
            if (typeof sessionId !== "string") return;

            const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

            this._sessions.set(sessionId, pluvWs);

            const userId = pluvWs.session.user?.id;

            if (!!userId) this._addUserSession(userId, sessionId);
        });

        const { doc, uninitialize } = this._initialize();

        this._doc = doc;
        this._uninitialize = uninitialize;
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
        this._emitQuitters();
        this._emitSyncState();
    }

    public getSize(): number {
        const currentTime = new Date().getTime();

        /**
         * @description Doing this instead of .size because some sessions
         * in the map can be considered as "omitted".
         * @date December 21, 2022
         */
        return Array.from(this._sessions.values()).reduce((count, pluvWs) => {
            if (pluvWs.state.quit) return count;

            const pingTime = this._platform.getLastPing(pluvWs) ?? pluvWs.state.timers.ping;

            return currentTime - pingTime > PING_TIMEOUT_MS ? count : count + 1;
        }, 0);
    }

    public onClose(
        webSocket: WebSocketType<TPlatform>,
    ): (event: AbstractCloseEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onError(
        webSocket: WebSocketType<TPlatform>,
    ): (event: AbstractErrorEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onMessage(
        webSocket: WebSocketType<TPlatform>,
    ): (event: AbstractMessageEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onMessage(wsSession);
    }

    public async register(
        webSocket: InferPlatformWebSocketSource<TPlatform>,
        ...options: keyof InferInitContextType<TPlatform> extends never
            ? [{ token?: string }?]
            : [WebSocketRegisterConfig<TPlatform>]
    ): Promise<void> {
        const _options = (options[0] ?? {}) as WebSocketRegisterConfig<TPlatform>;
        const token = _options.token ?? null;

        /**
         * TODO
         * @description Update the sessionId strategy so that the userId can be used to retrieve
         * the session in O(1) time if authorized.
         * @date April 15, 2025
         */
        const sessionId = this._platform.getSessionId(webSocket);
        const sessionExists = typeof sessionId === "string" && this._sessions.has(sessionId);

        if (sessionExists) return;

        if (!(await this._initialized)) {
            this._initialize();
            await this._initialized;
        }

        const user: BaseUser | null = await this._getAuthorizedUser(token, _options);
        const ioAuthorize = this._getIOAuthorize(_options);
        const isUnauthorized = !!ioAuthorize && !user;
        const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

        if (isUnauthorized) {
            this._logDebug(`${colors.blue("Authorization failed for connection")}`);
            pluvWs.handleError({ error: new Error("Not authorized"), room: this.id });
            pluvWs.close(3000, "WebSocket unauthorized.");

            return;
        }

        if (!!user) {
            const latest = this._getLatestPresence(user.id);
            const prevState = pluvWs.state;

            pluvWs.user = user;

            this._platform.setSerializedState(pluvWs, {
                ...prevState,
                presence: latest.presence,
                timers: { ...prevState.timers, presence: latest.timer },
            });
            this._addUserSession(user.id, pluvWs.sessionId);
        }

        this._logDebug(
            `${colors.blue(`Registering connection for room ${this.id}:`)} ${pluvWs.sessionId}`,
        );

        await this._platform.acceptWebSocket(pluvWs);
        this._sessions.set(pluvWs.sessionId, pluvWs);
        await this._platform.persistence.addUser(this.id, pluvWs.sessionId, user ?? {});

        if (this._platform._config.registrationMode === "attached") {
            const onClose = this._onClose(pluvWs).bind(this);
            const onMessage = this._onMessage(pluvWs).bind(this);

            pluvWs.addEventListener("close", onClose);
            pluvWs.addEventListener("error", onClose);
            pluvWs.addEventListener("message", onMessage);
        }

        await this._emitRegistered(pluvWs);

        const size = this.getSize();

        this._logDebug(oneLine`
            ${colors.blue(`Registered connection for room ${this.id}:`)}
            ${pluvWs.sessionId}
        `);
        this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);
    }

    private _addUserSession(userId: string, sessionId: string): Set<[sessionId: string][0]> {
        const set = this._userSessionss.get(userId) ?? new Set<string>();
        const updated = set.add(sessionId);

        this._userSessionss.set(userId, updated);

        return updated;
    }

    private async _broadcast(params: BroadcastParams<this>): Promise<void> {
        const { message, senderId } = params;

        const sender = senderId ? (this._sessions.get(senderId) ?? null) : null;
        const session = sender?.session ?? null;
        const user = session?.user ?? null;

        if (typeof senderId !== "string") return;

        this._platform.pubSub.publish(this.id, {
            connectionId: senderId ?? null,
            room: this.id,
            user,
            ...message,
        });
    }

    private async _closeWebSockets(
        webSockets: readonly AbstractWebSocket<any, TAuthorize>[],
    ): Promise<void> {
        const closeWebSocket = async (
            webSocket: AbstractWebSocket<any, TAuthorize>,
        ): Promise<void> => {
            webSocket.state = { ...webSocket.state, quit: true };

            const sessionId = webSocket.sessionId;

            this._logDebug(
                `${colors.blue(`Unregistering connection for room ${this.id}:`)} ${sessionId}`,
            );
            this._sessions.delete(sessionId);

            await this._platform.persistence.deleteUser(this.id, sessionId).catch(() => null);
            await this._broadcast({
                message: { type: "$exit", data: { sessionId } },
                senderId: sessionId,
            });

            const session = webSocket.session;
            const user = session.user;

            if (!!user) this._removeUserSession(user.id, sessionId);

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
                `${colors.blue(`Unregistered connection for room ${this.id}:`)} ${webSocket.sessionId}`,
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
        const currentTime = new Date().getTime();
        const quitters = Array.from(this._sessions.values()).filter((pluvWs) => {
            return pluvWs.state.quit || currentTime - pluvWs.state.timers.ping > PING_TIMEOUT_MS;
        });

        this._closeWebSockets(quitters);
    }

    private async _emitRegistered(pluvWs: AbstractWebSocket<any, TAuthorize>): Promise<void> {
        const session = pluvWs.session;
        const sessionId = session.id;
        const presence = session.presence;
        const user = session.user;

        const [doc, context] = await Promise.all([this._doc, this._getContext()]);
        const encodedState = doc.isEmpty() ? null : doc.getEncodedState();

        await this._sendSelfMessage(
            {
                type: "$registered",
                data: {
                    presence,
                    sessionId,
                    state: encodedState,
                    timers: { presence: session.timers.presence },
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

    private async _emitSyncState(): Promise<void> {
        const connectionIds = await this._platform.persistence
            .getUsers(this.id)
            .then((map) => Object.keys(map));

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

    private _getAbstractWs(
        webSocket: WebSocketType<TPlatform>,
    ): AbstractWebSocket<any, TAuthorize> | null {
        if ((webSocket as unknown as any) instanceof AbstractWebSocket) return webSocket;

        const sessionId = this._platform.getSessionId(webSocket);

        if (typeof sessionId === "string") {
            const session = this._sessions.get(sessionId) ?? null;

            if (session) return session;
        }

        const sessions = Array.from(this._sessions.values());

        return sessions.find((pluvWs) => pluvWs.webSocket === webSocket) ?? null;
    }

    /**
     * TODO
     * @description Revisit any cast types
     * @date July 17, 2025
     */
    private async _getAuthorizedUser(
        token: Maybe<string>,
        options: WebSocketRegisterConfig<TPlatform>,
    ): Promise<InferIOAuthorizeUser<TAuthorize>> {
        const ioAuthorize = this._getIOAuthorize(options);

        if (!ioAuthorize) return null as any;
        if (!token) return null as any;

        if (!ioAuthorize.secret)
            throw new Error("`authorize` was specified without a valid secret");

        const payload = await authorize({
            platform: this._platform,
            secret: ioAuthorize.secret,
        }).decode(token);

        if (!payload) {
            this._logDebug(colors.blue("Could not decode token:"));
            this._logDebug(token);

            return null as any;
        }

        if (payload.room !== this.id) {
            this._logDebug(colors.blue(`Token is not authorized for room ${this.id}:`));
            this._logDebug(colors.blue("Received:"), payload.room);
            this._logDebug(token);

            return null as any;
        }

        try {
            return ioAuthorize.user.parse(payload.user) ?? null;
        } catch {
            this._logDebug(`${colors.blue("Token fails validation:")} ${token}`);

            return null as any;
        }
    }

    private async _getContext(): Promise<TContext> {
        return typeof this._context === "function"
            ? await Promise.resolve(this._context(this._roomContext))
            : await Promise.resolve(this._context);
    }

    private async _getInitialDoc(): Promise<CrdtDocLike<any, any>> {
        const doc = this._docFactory.getEmpty();

        const [encodedState, context] = await Promise.all([
            this._platform.persistence.getStorageState(this.id),
            this._getContext(),
        ]);

        if (!encodedState) {
            const loadedState = await this._getInitialStorage({
                context,
                room: this.id,
            });

            if (!!loadedState && !this._docFactory.isEmpty(loadedState)) {
                doc.applyEncodedState({ update: loadedState });
            }
        }

        if (typeof encodedState === "string") {
            doc.applyEncodedState({ update: encodedState });

            // If we loaded storage from persistence and it's non-empty, storage was previously initialized.
            // This handles hibernation wake-up: restore the initialization state so that onStorageDestroyed
            // will fire correctly when the room is destroyed.
            if (!doc.isEmpty()) {
                this._storageInitializedViaSession = true;
            }
        }

        return doc;
    }

    private _getIOAuthorize(
        options: WebSocketRegisterConfig<TPlatform>,
    ): ResolvedPluvIOAuthorize<any, any> | null {
        if (typeof this._authorize === "function") return this._authorize(options);

        return this._authorize as ResolvedPluvIOAuthorize<any, any> | null;
    }

    private _getLatestPresence(userId: string): {
        timer: number | null;
        presence: JsonObject | null;
    } {
        if (!this._authorize) return { timer: null, presence: null };

        const sessionIds = Array.from(this._userSessionss.get(userId)?.values() ?? []);

        if (!sessionIds.length) return { timer: null, presence: null };

        return sessionIds.reduce(
            (state, sessionId) => {
                const pluvWs = this._sessions.get(sessionId) ?? null;

                if (!pluvWs) return state;

                const session = pluvWs.session;
                const presence = session.presence;
                const timer = session.timers.presence;

                if (session.user?.id !== userId) return state;
                if (typeof state.timer !== "number") return { presence, timer };
                if (typeof timer !== "number") return state;

                return timer > state.timer ? { presence, timer } : state;
            },
            { presence: null, timer: null } as {
                presence: JsonObject | null;
                timer: number | null;
            },
        );
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
    ): InferIOInput<this>[keyof TEvents] {
        const procedure = this._getProcedure(message);

        if (!procedure) return message.data;

        return procedure.config.input ? procedure.config.input.parse(message.data) : message.data;
    }

    private _getSession(webSocket: WebSocketType<TPlatform>): WebSocketSession<TAuthorize> {
        const pluvWs = this._getAbstractWs(webSocket);

        if (!pluvWs) throw new Error("Session could not be found");

        return pluvWs.session;
    }

    private _getSessions() {
        const sessions = Array.from(this._sessions.values()).map((pluvWs) => pluvWs.session);

        return sessions;
    }

    private _initialize() {
        const promise = (async () => {
            this._logDebug(`${colors.blue(`Initializing room: ${this.id}`)}`);

            if (!!this._uninitialize) {
                const uninitialize = (await this._uninitialize).bind(this);
                await uninitialize();

                this._uninitialize = null;
            }

            const pubSubId = await this._platform.pubSub.subscribe(
                this.id,
                async ({ options = {}, ...message }): Promise<void> => {
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
                        case "sync": {
                            await this._sendSyncMessage(message, sender);
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

            const doc = await this._getInitialDoc();

            // Track if doc was empty when room was first initialized
            this._wasDocEmptyOnInit = doc.isEmpty();

            const uninitialize = async () => {
                this._platform.pubSub.unsubscribe(pubSubId);

                const [doc, context] = await Promise.all([this._doc, this._getContext()]);
                const encodedState = doc.getEncodedState();

                doc.destroy();
                this._doc = Promise.resolve(this._docFactory.getEmpty());

                // Always emit onRoomDestroyed
                await Promise.resolve(
                    this._listeners.onRoomDestroyed({
                        ...("_meta" in this._platform && !!this._platform._meta
                            ? { _meta: this._platform._meta }
                            : {}),
                        context,
                        // DEPRECATED_ONROOMDELETED: Include encodedState for backward compatibility with onRoomDeleted
                        encodedState, // Deprecated: Use onStorageDestroyed for encodedState
                        platform: this._platform,
                        room: this.id,
                    }),
                );

                // DEPRECATED_ONDESTROY:
                if (this._listeners.onDestroy) {
                    await Promise.resolve(
                        this._listeners.onDestroy({
                            ...("_meta" in this._platform && !!this._platform._meta
                                ? { _meta: this._platform._meta }
                                : {}),
                            context,
                            encodedState, // Include encodedState for backward compatibility
                            platform: this._platform,
                            room: this.id,
                        }),
                    );
                }

                // Only emit onStorageDestroyed if storage was initialized via initializeSession
                if (this._storageInitializedViaSession) {
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

                    this._storageInitializedViaSession = false;
                }

                this._uninitialize = null;
            };

            return { doc, uninitialize };
        })();

        this._doc = promise.then((result) => result.doc);
        this._uninitialize = promise.then((result) => result.uninitialize);

        return { doc: this._doc, uninitialize: this._uninitialize };
    }

    private _logDebug(...data: any[]): void {
        if (this._debug) console.log(...data);
    }

    private _onClose(webSocket: AbstractWebSocket<any, TAuthorize>): () => Promise<void> {
        return async (): Promise<void> => {
            if (!(await this._initialized)) return;
            await this._closeWebSockets([webSocket]);
        };
    }

    private _onMessage(
        webSocket: AbstractWebSocket<any, TAuthorize>,
    ): (event: AbstractMessageEvent) => Promise<void> {
        return async (event: AbstractMessageEvent): Promise<void> => {
            if (!(await this._initialized)) return;

            const pluvWs = this._getAbstractWs(webSocket as WebSocketType<TPlatform>);

            if (!pluvWs) throw new Error("Could not get session");

            const session = this._getSession(pluvWs as WebSocketType<TPlatform>);
            const sessions = this._getSessions();

            const setPresence = (params: PatchPresenceParams): void => {
                this._setPresence.bind(this)(params);
            };

            const [doc, context] = await Promise.all([this._doc, this._getContext()]);
            const eventContext: EventResolverContext<
                EventResolverKind,
                TPlatform,
                TAuthorize,
                TContext
            > = {
                context,
                doc,
                garbageCollect: async () => {
                    await this.garbageCollect();
                },
                platform: this._platform,
                get presence() {
                    return session.presence as JsonObject | null;
                },
                set presence(presence: JsonObject | null) {
                    const sessionId = this.session?.id;

                    if (!sessionId) return;

                    setPresence({ presence, sessionId, timer: this.time });
                },
                room: this.id,
                session,
                sessions,
                time: new Date().getTime(),
            };

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
                    InferEventsOutput<TEvents>,
                    keyof InferEventsOutput<TEvents>
                >,
                platform: this._platform,
                room: this.id,
                user: session.user,
                webSocket: session.webSocket.webSocket,
            });

            const sessionId = session.id;
            const user = session.user;

            if (!procedure) {
                await this._broadcast({
                    message: message as any,
                    senderId: sessionId,
                });

                return;
            }

            let inputs: InferIOInput<this>[keyof TEvents];

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

            await Promise.all([
                procedure.config.broadcast?.(inputs, eventContext),
                procedure.config.self?.(inputs, eventContext),
                procedure.config.sync?.(inputs, eventContext),
            ]).then(async ([broadcast, self, sync]) => {
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

                const handleSync = async () => {
                    if (!sync) return;

                    await this._platform.pubSub.publish(this.id, {
                        connectionId: session.id,
                        options: { type: "sync" },
                        room: this.id,
                        user,
                        ...message,
                    });

                    const messages = Object.entries(sync).map(async ([type, data]) => {
                        await this._sendSelfMessage({ data, type }, { sessionId, user });
                    });

                    await Promise.all(messages);
                };

                await Promise.all([handleBroadcast(), handleSelf(), handleSync()]);
            });

            // After processing messages that might update storage (like $initializeSession),
            // check if storage was initialized via initializeSession
            await this._checkStorageInitializedViaSession();
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

    private _setPresence(params: PatchPresenceParams): void {
        const { presence, sessionId, timer: _timer } = params;

        const timer = _timer ?? new Date().getTime();
        const pluvWs = this._sessions.get(sessionId) ?? null;

        if (!pluvWs) return;

        const wsSession = pluvWs.session;
        const user = wsSession.user as BaseUser | null;

        const sessionIds = user
            ? new Set<string>([...(this._userSessionss.get(user.id) ?? []), sessionId])
            : new Set([sessionId]);

        sessionIds.forEach((sId) => {
            const pWs = this._sessions.get(sId);
            const session = pWs?.session;

            if (!session) return;

            const prevState = session.webSocket.state;

            this._platform.setSerializedState(session.webSocket, {
                ...prevState,
                presence,
                timers: {
                    ...prevState.timers,
                    presence: timer,
                },
            });
        });
    }

    private _removeUserSession(
        userId: string,
        sessionId: string,
    ): Set<[sessionId: string][0]> | null {
        const set = this._userSessionss.get(userId);

        if (!set) return null;

        set.delete(sessionId);

        if (!!set.size) return set;

        this._userSessionss.delete(userId);

        return set;
    }

    private async _checkStorageInitializedViaSession(): Promise<void> {
        if (this._storageInitializedViaSession) return;

        // Only mark as initialized if:
        // 1. Doc was empty when room was first initialized
        // 2. Doc is now non-empty
        // 3. At least one session has been registered
        const doc = await this._doc;
        if (this._wasDocEmptyOnInit && !doc.isEmpty() && this._sessions.size > 0) {
            this._storageInitializedViaSession = true;
        }
    }

    private async _sendMessage(
        pluvWs: AbstractWebSocket<any, TAuthorize>,
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

        if (typeof connectionId !== "string") return;

        const webSockets =
            sessionIds?.reduce((dict, id) => {
                const pluvWs = this._sessions.get(id);

                return pluvWs ? dict.set(id, pluvWs) : dict;
            }, new Map<string, AbstractWebSocket<any, TAuthorize>>()) ?? this._sessions;

        const promises = Array.from(webSockets.values()).map(async (pluvWs) => {
            const session = pluvWs.session;
            const user = session.user ?? null;

            this._sendMessage(pluvWs, { connectionId, data, room, type, user });
        });

        await Promise.all(promises);
    }

    private async _sendSelfMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
    ): Promise<void> {
        const senderId = sender?.sessionId ?? null;

        if (typeof senderId !== "string") return;

        const pluvWs = this._sessions.get(senderId);

        if (!pluvWs) return;

        /**
         * @description Note that this will not fire for Cloudflare's hibernatable websockets
         * because the server will auto-respond with the $pong event without calling any
         * functions.
         * @date April 18, 2025
         */
        if (message.type === "$pong") {
            const elapsedMs = Date.now() - this._lastGarbageCollectMs;

            if (elapsedMs > GARBAGE_COLLECT_INTERVAL_MS) {
                await this.garbageCollect();
            }
        }

        const session = pluvWs.session;
        const user = session.user ?? null;

        this._sendMessage(pluvWs, {
            connectionId: senderId,
            room: this.id,
            user,
            ...message,
        });
    }

    private async _sendSyncMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
    ): Promise<void> {
        if (!sender) return;

        const connectionId = sender.sessionId;

        if (typeof connectionId !== "string") return;

        const [doc, context] = await Promise.all([this._doc, this._getContext()]);
        const resolverCtx: EventResolverContext<"sync", TPlatform, TAuthorize, TContext> = {
            context,
            doc,
            garbageCollect: async () => {
                await this.garbageCollect();
            },
            platform: this._platform,
            get presence() {
                return null;
            },
            set presence(presence: JsonObject | null) {
                return;
            },
            room: this.id,
            session: null,
            sessions: this._getSessions(),
            time: new Date().getTime(),
        };

        const resolver = this._getProcedure(message)?.config.sync;

        if (!resolver) return;

        let inputs: InferIOInput<this>[keyof TEvents];

        try {
            inputs = this._getProcedureInputs(message);
        } catch {
            return;
        }

        Promise.resolve(resolver(inputs, resolverCtx)).then((output) => {
            if (!output) return;

            Object.keys(output).forEach((type: string) => {
                const data = output[type] ?? {};

                this._platform.pubSub.publish(this.id, {
                    connectionId,
                    data,
                    options: { type: "self" },
                    room: this.id,
                    type,
                    user: (sender.user ?? null) as BaseUser | null,
                });
            });
        });
    }
}

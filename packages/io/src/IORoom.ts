import type { AbstractCrdtDoc, AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    BaseIOEventRecord,
    EventMessage,
    IOAuthorize,
    IOEventMessage,
    IOLike,
    Id,
    InferEventMessage,
    InferEventsOutput,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InputZodLike,
    JsonObject,
    Maybe,
} from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferPlatformWebSocketSource, InferRoomContextType } from "./AbstractPlatform";
import { AbstractCloseEvent, AbstractErrorEvent, AbstractMessageEvent, AbstractWebSocket } from "./AbstractWebSocket";
import type { PluvRouter, PluvRouterEventConfig } from "./PluvRouter";
import { authorize } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type {
    EventResolverContext,
    IORoomListenerEvent,
    IORoomMessageEvent,
    WebSocketSession,
    WebSocketType,
} from "./types";

type BroadcastMessage<TIO extends IORoom<any, any, any, any>> =
    | InferEventMessage<InferIOInput<TIO>>
    | InferEventMessage<BaseIOEventRecord<InferIOAuthorize<TIO>>>;

interface BroadcastParams<TIO extends IORoom<any, any, any, any>> {
    message: BroadcastMessage<TIO>;
    senderId?: string;
}

export interface IORoomListeners<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> {
    onDestroy: (event: IORoomListenerEvent<TPlatform, TAuthorize, TContext, TEvents>) => void;
    onMessage: (event: IORoomMessageEvent<TPlatform, TAuthorize, TContext, TEvents>) => void;
}

export type BroadcastProxy<TIO extends IORoom<any, any, any, any>> = (<TEvent extends keyof InferIOInput<TIO>>(
    event: TEvent,
    data: Id<InferIOInput<TIO>[TEvent]>,
) => Promise<void>) & {
    [event in keyof InferIOInput<TIO>]: (data: Id<InferIOInput<TIO>>[event]) => Promise<void>;
};

export type IORoomConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context: TContext & InferRoomContextType<TPlatform>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug: boolean;
    platform: TPlatform;
    router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

interface SendMessageSender {
    sessionId: string | null;
    user: JsonObject | null;
}

export interface WebsocketRegisterOptions {
    token?: string | null;
}

export class IORoom<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TEvents>
{
    public readonly id: string;

    private _doc: Promise<AbstractCrdtDoc<any>>;
    private _uninitialize: Promise<() => Promise<void>> | null = null;

    private readonly _authorize: TAuthorize | null = null;
    private readonly _context: TContext & InferRoomContextType<TPlatform>;
    private readonly _debug: boolean;
    private readonly _docFactory: AbstractCrdtDocFactory<any>;
    private readonly _listeners: IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>;
    private readonly _platform: TPlatform;
    private readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
    private readonly _sessions = new Map<string, AbstractWebSocket>();

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            authorize: this._authorize,
            context: this._context,
            events: this._router._defs.events,
            platform: this._platform,
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
        const { authorize, context, crdt = noop, debug, onDestroy, onMessage, platform, router } = config;

        this.id = id;

        this._context = context;
        this._debug = debug;
        this._docFactory = crdt.doc(() => ({}));
        this._router = router;
        this._platform = platform.initialize({ context });

        this._listeners = {
            onDestroy: (event) => onDestroy?.(event),
            onMessage: (event) => onMessage?.(event),
        };

        if (authorize) this._authorize = authorize;

        const webSockets = this._platform.getWebSockets() as readonly InferPlatformWebSocketSource<TPlatform>[];

        webSockets.forEach((webSocket) => {
            const deserialized = this._platform.getSerializedState(webSocket);
            const sessionId = this._platform.getSessionId(webSocket);

            if (!deserialized) return;
            if (typeof sessionId !== "string") return;

            const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

            this._sessions.set(sessionId, pluvWs);
        });

        const { doc, uninitialize } = this._initialize();

        this._doc = doc;
        this._uninitialize = uninitialize;
    }

    public getSize(): number {
        const currentTime = new Date().getTime();

        /**
         * @description Doing this instead of .size because some sessions
         * in the map can be considered as "omitted".
         * @author leedavidcs
         * @date December 21, 2022
         */
        return Array.from(this._sessions.values()).reduce((count, pluvWs) => {
            if (pluvWs.state.quit) return count;

            const pingTime = this._platform.getLastPing(pluvWs) ?? pluvWs.state.timers.ping;

            return currentTime - pingTime > PING_TIMEOUT_MS ? count : count + 1;
        }, 0);
    }

    public onClose(webSocket: WebSocketType<TPlatform>): (event: AbstractCloseEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onError(webSocket: WebSocketType<TPlatform>): (event: AbstractErrorEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onClose(wsSession);
    }

    public onMessage(webSocket: WebSocketType<TPlatform>): (event: AbstractMessageEvent) => Promise<void> {
        this._ensureDetached();

        const wsSession = this._getAbstractWs(webSocket);

        if (!wsSession) return async () => undefined;

        return this._onMessage(wsSession);
    }

    public async register(
        webSocket: InferPlatformWebSocketSource<TPlatform>,
        options: WebsocketRegisterOptions = {},
    ): Promise<void> {
        const { token } = options;

        const sessionId = this._platform.getSessionId(webSocket);
        const sessionExists = typeof sessionId === "string" && this._sessions.has(sessionId);

        if (sessionExists) return;
        if (!(await this._initialized)) {
            this._initialize();

            await this._initialized;
        }

        const user = await this._getAuthorizedUser(token);
        const ioAuthorize = this._getIOAuthorize();
        const isUnauthorized = !!ioAuthorize?.required && !user;

        // There is an attempt for multiple of the same identities. Probably malicious.
        const isTokenInUse: boolean =
            !!user &&
            (await this._getSessions().then((sessions) => sessions.some((session) => session.user?.id === user.id)));

        const pluvWs = this._platform.convertWebSocket(webSocket, { room: this.id });

        this._logDebug(`${colors.blue(`Registering connection for room ${this.id}:`)} ${pluvWs.sessionId}`);

        await this._platform.acceptWebSocket(pluvWs);

        if (isUnauthorized || isTokenInUse) {
            this._logDebug(`${colors.blue("Authorization failed for connection:")} ${pluvWs.sessionId}`);

            pluvWs.handleError({ error: new Error("Not authorized"), room: this.id });
            pluvWs.close(3000, "WebSocket unauthorized.");

            return;
        }

        this._sessions.set(pluvWs.sessionId, pluvWs);

        await this._platform.persistance.addUser(this.id, pluvWs.sessionId, user ?? {});

        if (this._platform._registrationMode === "attached") {
            const onClose = this._onClose(pluvWs).bind(this);
            const onMessage = this._onMessage(pluvWs).bind(this);

            pluvWs.addEventListener("close", onClose);
            pluvWs.addEventListener("error", onClose);
            pluvWs.addEventListener("message", onMessage);
        }

        await this._emitRegistered(pluvWs);

        this._logDebug(`${colors.blue(`Registered connection for room ${this.id}:`)} ${pluvWs.sessionId}`);

        const size = this.getSize();

        this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);
    }

    private async _broadcast(params: BroadcastParams<this>): Promise<void> {
        const { message, senderId } = params;

        const sender = senderId ? (this._sessions.get(senderId) ?? null) : null;
        const session = (await sender?.getSession()) ?? null;
        const user = session?.user ?? null;

        this._platform.pubSub.publish(this.id, {
            connectionId: senderId ?? null,
            room: this.id,
            user,
            ...message,
        });
    }

    private async _emitQuitters(): Promise<void> {
        const currentTime = new Date().getTime();
        const quitters = Array.from(this._sessions.values()).filter(
            (pluvWs) => pluvWs.state.quit || currentTime - pluvWs.state.timers.ping > PING_TIMEOUT_MS,
        );

        quitters.forEach((pluvWs) => {
            this._sessions.delete(pluvWs.sessionId);
        });

        const promises = quitters.map(async (quitter) => {
            await this._broadcast({
                message: {
                    type: "$EXIT",
                    data: { sessionId: quitter.sessionId },
                },
                senderId: quitter.sessionId,
            });
        });

        await Promise.all(promises);
    }

    private async _emitRegistered(pluvWs: AbstractWebSocket): Promise<void> {
        const session = await pluvWs.getSession();
        const sessionId = session.id;
        const user = session.user;

        await this._sendSelfMessage({ type: "$REGISTERED", data: { sessionId } }, { sessionId, user });
    }

    private _ensureDetached(): void {
        if (this._platform._registrationMode === "detached") return;

        throw new Error("Platform must use detached mode");
    }

    private _getAbstractWs(webSocket: WebSocketType<TPlatform>): AbstractWebSocket | null {
        if ((webSocket as unknown as any) instanceof AbstractWebSocket) return webSocket;

        const sessionId = this._platform.getSessionId(webSocket);

        if (typeof sessionId === "string") {
            const session = this._sessions.get(sessionId) ?? null;

            if (session) return session;
        }

        const sessions = Array.from(this._sessions.values());

        return sessions.find((pluvWs) => pluvWs.webSocket === webSocket) ?? null;
    }

    private async _getAuthorizedUser(token: Maybe<string>): Promise<InferIOAuthorizeUser<InferIOAuthorize<this>>> {
        const ioAuthorize = this._getIOAuthorize();

        if (!ioAuthorize) return null as InferIOAuthorizeUser<InferIOAuthorize<this>>;
        if (!token) return null as InferIOAuthorizeUser<InferIOAuthorize<this>>;

        const payload = await authorize({
            platform: this._platform,
            secret: ioAuthorize.secret,
        }).decode(token);

        if (!payload) {
            this._logDebug(colors.blue("Could not decode token:"));
            this._logDebug(token);

            return null as InferIOAuthorizeUser<InferIOAuthorize<this>>;
        }

        if (payload.room !== this.id) {
            this._logDebug(colors.blue(`Token is not authorized for room ${this.id}:`));
            this._logDebug(colors.blue("Received:"), payload.room);
            this._logDebug(token);

            return null as InferIOAuthorizeUser<InferIOAuthorize<this>>;
        }

        try {
            return ioAuthorize.user.parse(payload.user) ?? null;
        } catch {
            this._logDebug(`${colors.blue("Token fails validation:")} ${token}`);

            return null as InferIOAuthorizeUser<InferIOAuthorize<this>>;
        }
    }

    private async _getInitialDoc(): Promise<AbstractCrdtDoc<any>> {
        const doc = this._docFactory.getEmpty();
        const encodedState = await this._platform.persistance.getStorageState(this.id);

        if (typeof encodedState === "string") doc.applyEncodedState({ update: encodedState });

        return doc;
    }

    private _getIOAuthorize() {
        if (typeof this._authorize === "function") {
            return this._authorize(this._context);
        }

        return this._authorize as {
            required: any;
            secret: string;
            user: InputZodLike<any>;
        } | null;
    }

    private _getProcedure(
        message: EventMessage<string, any>,
    ): (typeof this._router)["_defs"]["events"][keyof (typeof this._router)["_defs"]["events"]] | null {
        return this._router._defs.events[message.type as keyof (typeof this._router)["_defs"]["events"]] ?? null;
    }

    private _getProcedureInputs(message: EventMessage<string, any>): InferIOInput<this>[keyof TEvents] {
        const procedure = this._getProcedure(message);

        if (!procedure) return message.data;

        return procedure.config.input ? procedure.config.input.parse(message.data) : message.data;
    }

    private async _getSession(webSocket: WebSocketType<TPlatform>): Promise<WebSocketSession<TAuthorize>> {
        const pluvWs = this._getAbstractWs(webSocket);

        if (!pluvWs) throw new Error("Session could not be found");

        return await pluvWs.getSession<TAuthorize>();
    }

    private async _getSessions() {
        const promises = Array.from(this._sessions.values()).map(async (pluvWs) => await pluvWs.getSession());

        return await Promise.all(promises);
    }

    private _initialize() {
        const promise = (async () => {
            this._logDebug(`${colors.blue(`Initializing room ${this.id}:`)}`);

            if (!!this._uninitialize) {
                const uninitialize = (await this._uninitialize).bind(this);
                await uninitialize();

                this._uninitialize = null;
            }

            const pubSubId = await this._platform.pubSub.subscribe(
                this.id,
                async ({ options = {}, ...message }): Promise<void> => {
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
            const uninitialize = async () => {
                this._platform.pubSub.unsubscribe(pubSubId);

                const doc = await this._doc;
                const encodedState = doc.getEncodedState();

                doc.destroy();
                this._doc = Promise.resolve(this._docFactory.getEmpty());

                this._listeners.onDestroy({
                    ...(this._platform._meta ? { _meta: this._platform._meta } : {}),
                    context: this._context,
                    encodedState,
                    room: this.id,
                });

                this._uninitialize = null;
            };

            return { doc, uninitialize };
        })();

        this._doc = promise.then((result) => result.doc);
        this._uninitialize = promise.then((result) => result.uninitialize);

        return { doc: this._doc, uninitialize: this._uninitialize };
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _onClose(webSocket: AbstractWebSocket): () => Promise<void> {
        return async (): Promise<void> => {
            if (!(await this._initialized)) return;

            webSocket.state = { ...webSocket.state, quit: true };

            this._logDebug(`${colors.blue(`Unregistering connection for room ${this.id}:`)} ${webSocket.sessionId}`);
            this._sessions.delete(webSocket.sessionId);

            this._platform.persistance.deleteUser(this.id, webSocket.sessionId).finally(async () => {
                await this._broadcast({
                    message: {
                        type: "$EXIT",
                        data: { sessionId: webSocket.sessionId },
                    },
                    senderId: webSocket.sessionId,
                });

                const size = this.getSize();

                this._logDebug(`${colors.blue(`Unregistered connection for room ${this.id}:`)} ${webSocket.sessionId}`);
                this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);

                if (size) return;

                if (this._uninitialize) {
                    const uninitialize = (await this._uninitialize).bind(this);
                    await uninitialize();
                }
            });
        };
    }

    private _onMessage(webSocket: AbstractWebSocket): (event: AbstractMessageEvent) => Promise<void> {
        return async (event: AbstractMessageEvent): Promise<void> => {
            if (!(await this._initialized)) return;

            const pluvWs = this._getAbstractWs(webSocket as WebSocketType<TPlatform>);

            if (!pluvWs) throw new Error("Could not get session");

            const [session, sessions] = await Promise.all([
                this._getSession(pluvWs as WebSocketType<TPlatform>),
                this._getSessions(),
            ]);

            const doc = await this._doc;
            const baseContext: EventResolverContext<TPlatform, TAuthorize, TContext> = {
                context: this._context,
                doc,
                room: this.id,
                session,
                sessions,
            };

            if (pluvWs.state.quit) {
                pluvWs.close(1011, "WebSocket broken.");

                return;
            }

            const message = this._parseMessage(event);

            if (!message) return;

            const procedure = this._getProcedure(message);

            this._listeners.onMessage({
                ...(this._platform._meta ? { _meta: this._platform._meta } : {}),
                context: this._context,
                encodedState: doc.getEncodedState(),
                message: message as InferEventMessage<InferEventsOutput<TEvents>, keyof InferEventsOutput<TEvents>>,
                room: this.id,
                user: session.user,
            });

            if (!procedure) return;

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

            const extendedContext: EventResolverContext<
                TPlatform,
                TAuthorize,
                TContext & InferRoomContextType<TPlatform>
            > = { ...baseContext, context: { ...this._context } };

            await Promise.all([
                procedure.config.broadcast?.(inputs, extendedContext),
                procedure.config.self?.(inputs, extendedContext),
                procedure.config.sync?.(inputs, baseContext),
            ]).then(async ([broadcast, self, sync]) => {
                const sessionId = session.id;
                const user = session.user;

                const handleBroadcast = async () => {
                    if (!broadcast) return;

                    await Promise.all(
                        Object.entries(broadcast).map(async ([type, data]: any) => {
                            await this._broadcast({
                                message: { data, type },
                                senderId: sessionId,
                            });
                        }),
                    );
                };

                const handleSelf = async () => {
                    if (!self) return;

                    await Promise.all(
                        Object.entries(self).map(async ([type, data]) => {
                            await this._sendSelfMessage({ data, type }, { sessionId, user });
                        }),
                    );
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

                    await Promise.all(
                        Object.entries(sync).map(async ([type, data]) => {
                            await this._sendSelfMessage({ data, type }, { sessionId, user });
                        }),
                    );
                };

                await Promise.all([handleBroadcast(), handleSelf(), handleSync()]);
            });
        };
    }

    private _parseMessage(message: { data: string | ArrayBuffer }): EventMessage<string, any> | null {
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

    private async _sendMessage(pluvWs: AbstractWebSocket<any>, message: IOEventMessage<any>): Promise<void> {
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

        const webSockets =
            sessionIds?.reduce((dict, id) => {
                const pluvWs = this._sessions.get(id);

                return pluvWs ? dict.set(id, pluvWs) : dict;
            }, new Map<string, AbstractWebSocket>()) ?? this._sessions;

        const promises = Array.from(webSockets.values()).map(async (pluvWs) => {
            const session = await pluvWs.getSession();
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
        if (message.type === "$PONG") await this._emitQuitters();

        const session = await pluvWs.getSession();
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

        const doc = await this._doc;
        const context: EventResolverContext<TPlatform, TAuthorize, TContext> = {
            context: this._context,
            doc,
            room: this.id,
            session: null,
            sessions: await this._getSessions(),
        };

        const resolver = this._getProcedure(message)?.config.sync;

        if (!resolver) return;

        let inputs: InferIOInput<this>[keyof TEvents];

        try {
            inputs = this._getProcedureInputs(message);
        } catch {
            return;
        }

        Promise.resolve(resolver(inputs, context)).then((output) => {
            if (!output) return;

            Object.keys(output).forEach((type: string) => {
                const data = output[type] ?? {};

                this._platform.pubSub.publish(this.id, {
                    connectionId: sender.sessionId,
                    data,
                    options: { type: "self" },
                    room: this.id,
                    type,
                    user: sender.user ?? null,
                });
            });
        });
    }
}

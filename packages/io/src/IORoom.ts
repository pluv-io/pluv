import type { AbstractCrdtDoc, AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    BaseIOEventRecord,
    EventMessage,
    IOAuthorize,
    IOLike,
    Id,
    InferEventMessage,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InputZodLike,
    JsonObject,
    Maybe,
} from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferPlatformWebSocketType, InferRoomContextType } from "./AbstractPlatform";
import { AbstractCloseEvent, AbstractErrorEvent, AbstractMessageEvent } from "./AbstractWebSocket";
import type { PluvRouter, PluvRouterEventConfig } from "./PluvRouter";
import { authorize } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type { EventResolverContext, IORoomListenerEvent, SendMessageOptions, WebSocketSession } from "./types";

type BroadcastMessage<TIO extends IORoom<any, any, any, any>> =
    | InferEventMessage<InferIOInput<TIO>>
    | InferEventMessage<BaseIOEventRecord<InferIOAuthorize<TIO>>>;

interface BroadcastParams<TIO extends IORoom<any, any, any, any>> {
    message: BroadcastMessage<TIO>;
    senderId?: string;
}

interface IORoomListeners<TPlatform extends AbstractPlatform> {
    onDestroy: (event: IORoomListenerEvent<TPlatform>) => void;
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
> = Partial<IORoomListeners<TPlatform>> & {
    authorize?: TAuthorize;
    context: TContext & InferRoomContextType<TPlatform>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug: boolean;
    platform: TPlatform;
    router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

interface SendMessageSender {
    id: string | null;
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
    private readonly _context: TContext & InferRoomContextType<TPlatform>;
    private readonly _debug: boolean;
    private readonly _docFactory: AbstractCrdtDocFactory<any>;
    private readonly _platform: TPlatform;

    private _doc: AbstractCrdtDoc<any>;
    private _listeners: IORoomListeners<TPlatform>;
    private _sessions = new Map<string, WebSocketSession<TAuthorize>>();
    private _uninitialize: (() => Promise<void>) | null = null;

    readonly _authorize: TAuthorize | null = null;
    readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;

    readonly id: string;

    public get _events() {
        return this._router._events;
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

    constructor(id: string, config: IORoomConfig<TPlatform, TAuthorize, TContext, TEvents>) {
        const { authorize, context, crdt = noop, debug, onDestroy, platform, router } = config;

        this._context = context;
        this._debug = debug;
        this._docFactory = crdt.doc(() => ({}));
        this._doc = this._docFactory.getEmpty();
        this._router = router;
        this._platform = platform;

        this.id = id;

        this._listeners = {
            onDestroy: (event) => onDestroy?.(event),
        };

        if (authorize) this._authorize = authorize;
    }

    public getSize(): number {
        const currentTime = new Date().getTime();

        /**
         * @description Doing this instead of .size because some sessions
         * in the map can be considered as "omitted".
         * @author leedavidcs
         * @date December 21, 2022
         */
        return Array.from(this._sessions.values()).reduce((count, session) => {
            if (session.quit) return count;

            const pingTime = this._platform.getLastPing(session.webSocket) ?? session.timers.ping;

            return currentTime - pingTime > PING_TIMEOUT_MS ? count : count + 1;
        }, 0);
    }

    public onClose(webSocket: InferPlatformWebSocketType<TPlatform>): (event: AbstractCloseEvent) => void {
        this._ensureDetached();

        const wsSession = this._getSessionFromWs(webSocket);

        if (!wsSession) return (): void => undefined;

        return this._onClose(wsSession);
    }

    public onError(webSocket: InferPlatformWebSocketType<TPlatform>): (event: AbstractErrorEvent) => void {
        this._ensureDetached();

        const wsSession = this._getSessionFromWs(webSocket);

        if (!wsSession) return (): void => undefined;

        return this._onClose(wsSession);
    }

    public onMessage(webSocket: InferPlatformWebSocketType<TPlatform>): (event: AbstractMessageEvent) => void {
        this._ensureDetached();

        const wsSession = this._getSessionFromWs(webSocket);

        if (!wsSession) return (): void => undefined;

        return this._onMessage(wsSession);
    }

    public async register(
        webSocket: InferPlatformWebSocketType<TPlatform>,
        options: WebsocketRegisterOptions = {},
    ): Promise<void> {
        const { token } = options;

        if (!this._uninitialize) await this._initialize();

        const user = await this._getAuthorizedUser(token);

        const pluvWs = this._platform.convertWebSocket(webSocket, {
            room: this.id,
            userId: user?.id ?? null,
        });

        this._logDebug(`${colors.blue(`Registering connection for room ${this.id}:`)} ${pluvWs.sessionId}`);

        await this._platform.acceptWebSocket(pluvWs);

        const ioAuthorize = this._getIOAuthorize();

        const isUnauthorized = !!ioAuthorize?.required && !user;
        // There is an attempt for multiple of the same identities. Probably malicious.
        const isTokenInUse =
            !!user && Array.from(this._sessions.values()).some((session) => session.user?.id === user.id);

        if (isUnauthorized || isTokenInUse) {
            this._logDebug(`${colors.blue("Authorization failed for connection:")} ${pluvWs.sessionId}`);

            pluvWs.handleError({ error: new Error("Not authorized") });
            pluvWs.close(3000, "WebSocket unauthorized.");

            return;
        }

        const currentTime = new Date().getTime();
        const session: WebSocketSession<TAuthorize> = {
            id: pluvWs.sessionId,
            presence: null,
            quit: false,
            room: this.id,
            timers: {
                ping: currentTime,
            },
            webSocket: pluvWs,
            user,
        };

        this._sessions.set(session.id, session);

        await this._platform.persistance.addUser(this.id, pluvWs.sessionId, user ?? {});

        if (this._platform._registrationMode === "attached") {
            const onClose = this._onClose(session).bind(this);
            const onMessage = this._onMessage(session).bind(this);

            pluvWs.addEventListener("close", onClose);
            pluvWs.addEventListener("error", onClose);
            pluvWs.addEventListener("message", onMessage);
        }

        this._emitRegistered(session);

        this._logDebug(`${colors.blue(`Registered connection for room ${this.id}:`)} ${pluvWs.sessionId}`);

        const size = this.getSize();

        this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);
    }

    private _broadcast(params: BroadcastParams<this>): void {
        const { message, senderId } = params;

        const sender = senderId ? this._sessions.get(senderId) : null;

        this._platform.pubSub.publish(this.id, {
            connectionId: senderId ?? null,
            room: this.id,
            user: sender?.user ?? null,
            ...message,
        });
    }

    private _emitQuitters(): void {
        const currentTime = new Date().getTime();
        const quitters = Array.from(this._sessions.values()).filter(
            (session) => session.quit || currentTime - session.timers.ping > PING_TIMEOUT_MS,
        );

        quitters.forEach((session) => {
            this._sessions.delete(session.id);
        });

        quitters.forEach((quitter) => {
            this._broadcast({
                message: {
                    type: "$EXIT",
                    data: { sessionId: quitter.id },
                },
                senderId: quitter.id,
            });
        });
    }

    private _emitRegistered(session: WebSocketSession<TAuthorize>): void {
        this._sendSelfMessage(
            {
                type: "$REGISTERED",
                data: { sessionId: session.id },
            },
            session,
        );
    }

    private _ensureDetached(): void {
        if (this._platform._registrationMode === "detached") return;

        throw new Error("Platform must use detached mode");
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

    private _getProcedure(
        message: EventMessage<string, any>,
    ): (typeof this._router)["_events"][keyof (typeof this._router)["_events"]] | null {
        return this._router._events[message.type as keyof (typeof this._router)["_events"]] ?? null;
    }

    private _getProcedureInputs(message: EventMessage<string, any>): InferIOInput<this>[keyof TEvents] {
        const procedure = this._getProcedure(message);

        if (!procedure) return message.data;

        return procedure.config.input ? procedure.config.input.parse(message.data) : message.data;
    }

    private _getSessionFromWs(webSocket: InferPlatformWebSocketType<TPlatform>): WebSocketSession<TAuthorize> | null {
        const sessionId = this._platform.getSessionId(webSocket);

        if (typeof sessionId === "string") {
            const session = this._sessions.get(sessionId) ?? null;

            if (session) return session;
        }

        const sessions = Array.from(this._sessions.values());

        return sessions.find((session) => session.webSocket === webSocket) ?? null;
    }

    private async _initialize(): Promise<void> {
        this._logDebug(`${colors.blue(`Initializing room ${this.id}:`)}`);

        if (!!this._uninitialize) {
            await this._uninitialize();

            this._uninitialize = null;
        }

        const pubSubId = await this._platform.pubSub.subscribe(this.id, ({ options = {}, ...message }) => {
            const session = {
                id: message.connectionId,
                user: message.user,
            };

            this._sendMessage(message, session, options);
        });

        this._uninitialize = async () => {
            this._platform.pubSub.unsubscribe(pubSubId);

            const encodedState = this._doc.getEncodedState();

            this._doc.destroy();
            this._doc = this._docFactory.getEmpty();

            this._listeners.onDestroy({
                ...this._context,
                encodedState,
                room: this.id,
            });

            this._uninitialize = null;
        };
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _onClose(session: WebSocketSession<TAuthorize>): () => void {
        return (): void => {
            if (!this._uninitialize) return;

            session.quit = true;

            this._logDebug(`${colors.blue(`(Unregistering connection for room ${this.id}:`)} ${session.id}`);
            this._sessions.delete(session.id);

            this._platform.persistance.deleteUser(this.id, session.id).finally(() => {
                this._broadcast({
                    message: {
                        type: "$EXIT",
                        data: { sessionId: session.id },
                    },
                    senderId: session.id,
                });

                const size = this.getSize();

                this._logDebug(`${colors.blue(`Unregistered connection for room ${this.id}:`)} ${session.id}`);
                this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);

                if (size) return;

                this._uninitialize?.();
            });
        };
    }

    private _onMessage(session: WebSocketSession<TAuthorize>): (event: AbstractMessageEvent) => void {
        return (event: AbstractMessageEvent): void => {
            const baseContext: EventResolverContext<TPlatform, TAuthorize, TContext> = {
                context: this._context,
                doc: this._doc,
                room: this.id,
                session,
                sessions: this._sessions,
            };

            if (!this._uninitialize) return;

            if (session.quit) {
                session.webSocket.close(1011, "WebSocket broken.");

                return;
            }

            const message = this._parseMessage(event);

            if (!message) return;

            const procedure = this._getProcedure(message);

            if (!procedure) return;

            let inputs: InferIOInput<this>[keyof TEvents];

            try {
                inputs = this._getProcedureInputs(message);
            } catch (error) {
                session?.webSocket.handleError({
                    error,
                    message: "Invalid input",
                    session,
                });

                return;
            }

            const extendedContext: EventResolverContext<
                TPlatform,
                TAuthorize,
                TContext & InferRoomContextType<TPlatform>
            > = { ...baseContext, context: { ...this._context } };

            Promise.all([
                procedure.config.broadcast?.(inputs, extendedContext),
                procedure.config.self?.(inputs, extendedContext),
                procedure.config.sync?.(inputs, baseContext),
            ]).then(([broadcast, self, sync]) => {
                if (broadcast) {
                    Object.entries(broadcast).forEach(([type, data]: any) => {
                        this._broadcast({
                            message: { data, type },
                            senderId: session.id,
                        });
                    });
                }

                if (self) {
                    Object.entries(self).forEach(([type, data]) => {
                        this._sendSelfMessage({ data, type }, session);
                    });
                }

                if (sync) {
                    this._platform.pubSub.publish(this.id, {
                        connectionId: session.id,
                        options: { type: "sync" },
                        room: this.id,
                        user: session.user,
                        ...message,
                    });

                    Object.entries(sync).forEach(([type, data]) => {
                        this._sendSelfMessage({ data, type }, session);
                    });
                }
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

    private _sendMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
        options: SendMessageOptions = {},
    ): void {
        switch (options.type) {
            case "self": {
                this._sendSelfMessage(message, sender);

                return;
            }
            case "sync": {
                this._sendSyncMessage(message, sender);

                return;
            }
            case "broadcast":
            default: {
                const sessionIds = options.sessionIds;

                this._sendBroadcastMessage(message, sender, sessionIds);
            }
        }
    }

    private _sendBroadcastMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
        sessionIds?: readonly string[],
    ): void {
        const senderId = sender?.id ?? null;

        const sessions =
            sessionIds?.reduce((dict, id) => {
                const _session = this._sessions.get(id);

                return _session ? dict.set(id, _session) : dict;
            }, new Map<string, WebSocketSession<TAuthorize>>()) ?? this._sessions;

        Array.from(sessions.values()).forEach((_session) => {
            _session.webSocket.sendMessage({
                connectionId: senderId,
                room: this.id,
                user: _session.user,
                ...message,
            });
        });
    }

    private _sendSelfMessage(message: EventMessage<string, any>, sender: SendMessageSender | null): void {
        const senderId = sender?.id;

        if (!senderId) return;

        const session = this._sessions.get(senderId);

        if (!session) return;
        if (message.type === "$PONG") this._emitQuitters();

        session.webSocket.sendMessage({
            connectionId: sender.id,
            room: this.id,
            user: sender.user,
            ...message,
        });
    }

    private _sendSyncMessage(message: EventMessage<string, any>, sender: SendMessageSender | null): void {
        const senderId = sender?.id;

        if (!senderId) return;

        const context: EventResolverContext<TPlatform, TAuthorize, TContext> = {
            context: this._context,
            doc: this._doc,
            room: this.id,
            session: null,
            sessions: this._sessions,
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
                    connectionId: senderId,
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

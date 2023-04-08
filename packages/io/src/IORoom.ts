import type { YjsDoc } from "@pluv/crdt-yjs";
import { doc } from "@pluv/crdt-yjs";
import type {
    BaseIOAuthorize,
    BaseIOEventRecord,
    EventMessage,
    EventRecord,
    Id,
    InferEventMessage,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    IOAuthorize,
    IOLike,
    JsonObject,
    Maybe,
    MaybePromise,
} from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferWebSocketType } from "./AbstractPlatform";
import { authorize } from "./authorize";
import type {
    EventResolverContext,
    InferEventConfig,
    SendMessageOptions,
    WebSocketSession,
} from "./types";

const PING_TIMEOUT_MS = 30_000;

type BroadcastMessage<TIO extends IORoom<any, any, any, any, any>> =
    | InferEventMessage<InferIOInput<TIO>>
    | InferEventMessage<BaseIOEventRecord<InferIOAuthorize<TIO>>>;

interface BroadcastParams<TIO extends IORoom<any, any, any, any, any>> {
    message: BroadcastMessage<TIO>;
    senderId?: string;
}

interface IORoomListeners {
    onDestroy: (encodedState: string) => void;
}

export type IORoomConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutput extends EventRecord<string, any> = {}
> = Partial<IORoomListeners> & {
    authorize?: TAuthorize;
    context: TContext;
    debug: boolean;
    events: InferEventConfig<TContext, TInput, TOutput>;
    initialStorage?: () => MaybePromise<Maybe<string>>;
    platform: TPlatform;
};

interface SendMessageSender {
    id: string | null;
    user: JsonObject | null;
}

export interface WebsocketRegisterOptions {
    token?: string;
}

export class IORoom<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutput extends EventRecord<string, any> = {}
> implements IOLike<TAuthorize, TInput, TOutput>
{
    private readonly _context: TContext;
    private readonly _debug: boolean;
    private readonly _platform: TPlatform;

    private _doc: YjsDoc<any> = doc();
    private _initialStorage: (() => MaybePromise<Maybe<string>>) | null = null;
    private _listeners: IORoomListeners;
    private _sessions = new Map<string, WebSocketSession>();
    private _uninitialize: (() => Promise<void>) | null = null;

    readonly _authorize: TAuthorize | null = null;
    readonly _events: InferEventConfig<TContext, TInput, TOutput>;

    readonly id: string;

    constructor(
        id: string,
        config: IORoomConfig<TPlatform, TAuthorize, TContext, TInput, TOutput>
    ) {
        const {
            authorize,
            context,
            debug,
            events,
            initialStorage,
            onDestroy,
            platform,
        } = config;

        this._context = context;
        this._debug = debug;
        this._events = events;
        this._platform = platform;

        this.id = id;

        this._listeners = {
            onDestroy: (encodedState) => onDestroy?.(encodedState),
        };

        if (authorize) this._authorize = authorize;
        if (initialStorage) this._initialStorage = initialStorage;
    }

    public broadcast<TEvent extends keyof InferIOInput<this>>(
        event: TEvent,
        data: Id<InferIOInput<this>[TEvent]>
    ): Promise<void> {
        const message = { type: event, data } as BroadcastMessage<this>;

        return Promise.resolve(this._broadcast({ message }));
    }

    public async register(
        webSocket: InferWebSocketType<TPlatform>,
        options?: WebsocketRegisterOptions
    ): Promise<void> {
        if (!this._uninitialize) await this._initialize();

        const token = options?.token;
        const sessionId = this._platform.randomUUID();
        const pluvWs = this._platform.convertWebSocket(webSocket, {
            room: this.id,
        });

        this._logDebug(
            `${colors.blue(
                `Registering connection for room ${this.id}:`
            )} ${sessionId}`
        );

        const uninitializeWs = await pluvWs.initialize();

        const user = await this._getAuthorizedUser(token);

        const isUnauthorized = !!this._authorize?.required && !user;
        // There is an attempt for multiple of the same identities. Probably malicious.
        const isTokenInUse =
            !!user &&
            Array.from(this._sessions.values()).some(
                (session) => session.user?.id === user.id
            );

        if (isUnauthorized || isTokenInUse) {
            this._logDebug(
                `${colors.blue(
                    "Authorization failed for connection:"
                )} ${sessionId}`
            );

            pluvWs.handleError({ error: new Error("Not authorized") });
            pluvWs.close(3000, "WebSocket unauthorized.");

            return;
        }

        const currentTime = new Date().getTime();
        const session: WebSocketSession = {
            id: sessionId,
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

        await this._platform.persistance.addUser(
            this.id,
            sessionId,
            user ?? {}
        );

        this._emitRegistered(session);
        this._emitStorageReceived(session);
        this._emitUserJoined(session);

        const context: EventResolverContext<TContext> = {
            context: this._context,
            doc: this._doc,
            room: this.id,
            session,
            sessions: this._sessions,
        };

        pluvWs.addEventListener("message", (event) => {
            if (!this._uninitialize) return;

            if (session.quit) {
                session.webSocket.close(1011, "WebSocket broken.");

                return;
            }

            const message = this._parseMessage(event);

            if (!message) return;

            const eventConfig = this._getEventConfig(message);

            if (!eventConfig) return;

            this._resolveMessage(message, context).then((output) => {
                if (!output) return;

                const eventType = eventConfig.options?.type ?? "broadcast";

                switch (eventType) {
                    case "self": {
                        Object.entries(output).forEach(([type, data]) => {
                            this._sendSelfMessage({ data, type }, session);
                        });

                        return;
                    }
                    case "sync": {
                        this._platform.pubSub.publish(this.id, {
                            connectionId: session.id,
                            options: eventConfig.options,
                            room: this.id,
                            user: session.user,
                            ...message,
                        });

                        Object.entries(output).forEach(([type, data]) => {
                            this._sendSelfMessage({ data, type }, session);
                        });

                        return;
                    }
                    case "broadcast":
                    default: {
                        Object.entries(output).forEach(([type, data]: any) => {
                            this._broadcast({
                                message: { data, type },
                                senderId: session.id,
                            });
                        });
                    }
                }
            });
        });

        const closeHandler = () => {
            if (!this._uninitialize) return;

            session.quit = true;

            this._logDebug(
                `${colors.blue(
                    `(Unregistering connection for room ${this.id}:`
                )} ${sessionId}`
            );
            this._sessions.delete(session.id);

            this._platform.persistance
                .deleteUser(this.id, session.id)
                .finally(() => {
                    this._broadcast({
                        message: {
                            type: "$EXIT",
                            data: { sessionId: session.id },
                        },
                        senderId: session.id,
                    });

                    uninitializeWs();

                    const size = this._getSessionsSize();

                    this._logDebug(
                        `${colors.blue(
                            `Unregistered connection for room ${this.id}:`
                        )} ${sessionId}`
                    );
                    this._logDebug(
                        `${colors.blue(`Room ${this.id} size:`)} ${size}`
                    );

                    if (size) return;

                    this._uninitialize?.();
                });
        };

        pluvWs.addEventListener("close", closeHandler);
        pluvWs.addEventListener("error", closeHandler);

        this._logDebug(
            `${colors.blue(
                `Registered connection for room ${this.id}:`
            )} ${sessionId}`
        );

        const size = this._getSessionsSize();

        this._logDebug(`${colors.blue(`Room ${this.id} size:`)} ${size}`);
    }

    private _broadcast(params: BroadcastParams<this>): void {
        const { message, senderId } = params;

        const currentTime = new Date().getTime();
        const sender = senderId ? this._sessions.get(senderId) : null;

        const quitters = Array.from(this._sessions.values()).filter(
            (session) =>
                session.quit ||
                currentTime - session.timers.ping > PING_TIMEOUT_MS
        );

        quitters.forEach((session) => {
            this._sessions.delete(session.id);
        });

        this._emitQuitters(quitters);

        this._platform.pubSub.publish(this.id, {
            connectionId: senderId ?? null,
            room: this.id,
            user: sender?.user ?? null,
            ...message,
        });
    }

    private _emitQuitters(quitters: readonly WebSocketSession[]): void {
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

    private _emitRegistered(session: WebSocketSession): void {
        this._sendSelfMessage(
            {
                type: "$REGISTERED",
                data: { sessionId: session.id },
            },
            session
        );
    }

    private _emitStorageReceived(session: WebSocketSession): void {
        this._platform.persistance
            .getStorageState(this.id)
            .then(async (_state) => {
                const state =
                    _state ??
                    (await this._initialStorage?.()) ??
                    this._doc.encodeStateAsUpdate();

                this._sendSelfMessage(
                    {
                        type: "$STORAGE_RECEIVED",
                        data: { state },
                    },
                    session
                );
            });
    }

    private _emitUserJoined(session: WebSocketSession): void {
        const user = session.user as any;

        if (!user) return;

        this._broadcast({
            message: {
                type: "$USER_JOINED",
                data: {
                    connectionId: session.id,
                    user,
                },
            },
            senderId: session.id,
        });
    }

    private async _getAuthorizedUser(
        token: string | undefined
    ): Promise<InferIOAuthorizeUser<InferIOAuthorize<this>> | null> {
        if (!this._authorize) return null;
        if (!token) return null;

        const payload = await authorize({
            platform: this._platform,
            secret: this._authorize.secret,
        }).decode(token);

        if (!payload) {
            this._logDebug(colors.blue("Could not decode token:"));
            this._logDebug(token);

            return null;
        }

        if (payload.room !== this.id) {
            this._logDebug(
                colors.blue(`Token is not authorized for room ${this.id}:`)
            );
            this._logDebug(colors.blue("Received:"), payload.room);
            this._logDebug(token);

            return null;
        }

        try {
            return this._authorize.user.parse(payload.user) ?? null;
        } catch {
            this._logDebug(
                `${colors.blue("Token fails validation:")} ${token}`
            );

            return null;
        }
    }

    private _getSessionsSize(): number {
        const currentTime = new Date().getTime();

        /**
         * @description Doing this instead of .size because some sessions
         * in the map can be considered as "omitted".
         * @author leedavidcs
         * @date December 21, 2022
         */
        return Array.from(this._sessions.values()).reduce((count, session) => {
            if (session.quit) return count;

            return currentTime - session.timers.ping > PING_TIMEOUT_MS
                ? count
                : count + 1;
        }, 0);
    }

    private _getEventConfig(
        message: EventMessage<string, any>
    ): InferEventConfig<TContext, TInput, TOutput>[keyof TInput] | null {
        return this._events[message.type as keyof TInput] ?? null;
    }

    private async _initialize(): Promise<void> {
        this._logDebug(`${colors.blue(`Initializing room ${this.id}:`)}`);

        if (!!this._uninitialize) {
            await this._uninitialize();

            this._uninitialize = null;
        }

        const pubSubId = await this._platform.pubSub.subscribe(
            this.id,
            ({ options = {}, ...message }) => {
                const session = {
                    id: message.connectionId,
                    user: message.user,
                };

                this._sendMessage(message, session, options);
            }
        );

        this._uninitialize = async () => {
            this._platform.pubSub.unsubscribe(pubSubId);

            const encodedState = this._doc.encodeStateAsUpdate();

            this._doc.destroy();
            this._doc = doc();

            this._listeners.onDestroy(encodedState);
        };
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _parseMessage(message: {
        data: string | ArrayBuffer;
    }): EventMessage<string, any> | null {
        const parsed = this._platform.parseData(message.data);

        try {
            if (typeof parsed !== "object") return null;
            if (typeof parsed.type !== "string") return null;
            if (typeof parsed.data !== "object") return null;

            return parsed as EventMessage<string, any>;
        } catch {
            return null;
        }
    }

    private async _resolveMessage(
        message: EventMessage<string, any>,
        context: EventResolverContext<TContext>
    ): Promise<TOutput | null> {
        const { session } = context;

        const eventConfig = this._getEventConfig(message);

        if (!eventConfig) return null;

        let input: TInput[string];

        /**
         * !HACK
         * @description If the config doesn't specify validation, we
         * assume no input is to be expected, but pass through all values
         * regardless. Leave this up to the implementer of the event.
         * @author leedavidcs
         * @date September 25, 2022
         */
        try {
            input = eventConfig.input
                ? (eventConfig.input.parse(message.data) as TInput[string])
                : message.data;
        } catch (error) {
            session?.webSocket.handleError({
                error,
                message: "Invalid input",
                session,
            });

            return null;
        }

        const output = await eventConfig.resolver(input, context);

        if (!output) return null;

        return output;
    }

    private _sendMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null,
        options: SendMessageOptions = {}
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
        sessionIds?: readonly string[]
    ): void {
        const senderId = sender?.id ?? null;

        const sessions =
            sessionIds?.reduce((dict, id) => {
                const _session = this._sessions.get(id);

                return _session ? dict.set(id, _session) : dict;
            }, new Map<string, WebSocketSession>()) ?? this._sessions;

        Array.from(sessions.values()).forEach((_session) => {
            _session.webSocket.sendMessage({
                connectionId: senderId,
                room: this.id,
                user: _session.user,
                ...message,
            });
        });
    }

    private _sendSelfMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null
    ): void {
        const senderId = sender?.id;

        if (!senderId) return;

        const session = this._sessions.get(senderId);

        if (!session) return;

        session.webSocket.sendMessage({
            connectionId: sender.id,
            room: this.id,
            user: sender.user,
            ...message,
        });
    }

    private _sendSyncMessage(
        message: EventMessage<string, any>,
        sender: SendMessageSender | null
    ): void {
        const senderId = sender?.id;

        if (!senderId) return;

        this._resolveMessage(message, {
            context: this._context,
            doc: this._doc,
            room: this.id,
            session: null,
            sessions: this._sessions,
        }).then((output) => {
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

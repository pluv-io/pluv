import type {
    BaseIOAuthorize,
    EventRecord,
    IOAuthorize,
    IOLike,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutputBroadcast,
    InferIOOutputSelf,
    InferIOOutputSync,
    JsonObject,
    Maybe,
    MaybePromise,
    Spread,
} from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform } from "./AbstractPlatform";
import { IORoom } from "./IORoom";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import type { EventConfig, InferEventConfig } from "./types";

export type InferIOContext<TIO extends PluvIO<any, any, any, any, any>> =
    TIO extends PluvIO<any, any, infer IContext, any, any> ? IContext : never;

export type InferIOPlatform<TIO extends PluvIO<any, any, any, any>> =
    TIO extends PluvIO<infer IPlatform, any, any, any, any> ? IPlatform : never;

export type InferIORoom<TIO extends PluvIO<any, any, any, any>> =
    TIO extends PluvIO<
        infer IPlatform,
        infer IAuthorize,
        infer IContext,
        infer IInput,
        infer IOutput
    >
        ? IORoom<IPlatform, IAuthorize, IContext, IInput, IOutput>
        : never;

export interface PluvIORegisterOptions {
    token?: string;
}

export interface PluvIOListeners {
    onRoomDeleted: (room: string, encodedState: string) => void;
    onStorageUpdated: (room: string, encodedState: string) => void;
}

export type PluvIOConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any> | null = null,
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutputBroadcast extends EventRecord<string, any> = {},
    TOutputSelf extends EventRecord<string, any> = {},
    TOutputSync extends EventRecord<string, any> = {}
> = Partial<PluvIOListeners> & {
    authorize?: TAuthorize;
    context?: TContext;
    debug?: boolean;
    events?: InferEventConfig<
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    >;
    initialStorage?: (room: string) => MaybePromise<Maybe<string>>;
    platform: TPlatform;
};

export interface GetRoomOptions {
    debug?: boolean;
}

export class PluvIO<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutputBroadcast extends EventRecord<string, any> = {},
    TOutputSelf extends EventRecord<string, any> = {},
    TOutputSync extends EventRecord<string, any> = {}
> implements
        IOLike<TAuthorize, TInput, TOutputBroadcast, TOutputSelf, TOutputSync>
{
    private _context: TContext = {} as TContext;
    private _initialStorage:
        | ((room: string) => MaybePromise<Maybe<string>>)
        | null = null;
    private _listeners: PluvIOListeners;
    private _rooms = new Map<
        string,
        IORoom<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            TOutputBroadcast,
            TOutputSelf,
            TOutputSync
        >
    >();

    readonly _authorize: TAuthorize | null = null;
    readonly _debug: boolean;
    readonly _events: InferEventConfig<
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    > = {
        $GET_OTHERS: {
            resolver: (data, { room, session, sessions }) => {
                const others = Array.from(sessions.entries())
                    .filter(([, wsSession]) => wsSession.id !== session?.id)
                    .reduce<{
                        [connectionId: string]: {
                            connectionId: string;
                            room: string | null;
                            user: InferIOAuthorizeUser<TAuthorize>;
                        };
                    }>(
                        (acc, [connectionId, { presence, user }]) => ({
                            ...acc,
                            [connectionId]: {
                                connectionId,
                                presence,
                                room,
                                user: user as InferIOAuthorizeUser<TAuthorize>,
                            },
                        }),
                        {}
                    );

                return { $OTHERS_RECEIVED: { others } };
            },
            options: { type: "sync" },
        },
        $INITIALIZE_SESSION: {
            resolver: ({ presence }, { session }) => {
                if (!session) return {};

                session.presence = presence;

                return {
                    $USER_JOINED: {
                        connectionId: session.id,
                        user: session.user,
                        presence,
                    },
                };
            },
        },
        $PING: {
            resolver: (data, { session }) => {
                if (!session) return {};

                const currentTime = new Date().getTime();

                session.timers.ping = currentTime;

                return { $PONG: {} };
            },
            options: { type: "self" },
        },
        $UPDATE_PRESENCE: {
            resolver: ({ presence }, { session }) => {
                if (!session) return {};

                session.presence = Object.assign(
                    Object.create(null),
                    session.presence,
                    presence
                );

                return { $PRESENCE_UPDATED: { presence } };
            },
        },
        $UPDATE_STORAGE: {
            resolver: ({ origin, update }, { doc, room }) => {
                if (
                    origin === "$STORAGE_RECEIVED" &&
                    Object.keys(doc.toJSON()).length
                ) {
                    return;
                }

                const updated = doc.applyUpdate(update);
                const state = updated.encodeStateAsUpdate();

                this._platform.persistance
                    .setStorageState(room, state)
                    .then(() => {
                        this._listeners.onStorageUpdated(room, state);
                    });

                return { $STORAGE_UPDATED: { state } };
            },
        },
    } as InferEventConfig<
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    >;
    readonly _platform: TPlatform;

    constructor(
        options: PluvIOConfig<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            TOutputBroadcast,
            TOutputSelf,
            TOutputSync
        >
    ) {
        const {
            authorize,
            context,
            debug = false,
            events,
            initialStorage,
            onRoomDeleted,
            onStorageUpdated,
            platform,
        } = options;

        this._debug = debug;
        this._platform = platform;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
        if (events) this._events = events;
        if (initialStorage) this._initialStorage = initialStorage;

        this._listeners = {
            onRoomDeleted: (room, encodedState) => {
                return onRoomDeleted?.(room, encodedState);
            },
            onStorageUpdated: (room, encodedState) => {
                return onStorageUpdated?.(room, encodedState);
            },
        };
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>>
    ): Promise<string> {
        if (!this._authorize) {
            throw new Error(
                "IO does not specify authorize during initialization."
            );
        }

        return await authorize({
            platform: this._platform,
            secret: this._authorize.secret,
        }).encode(params);
    }

    public event<
        TEvent extends string,
        TData extends JsonObject = {},
        TResultBroadcast extends EventRecord<string, any> = {},
        TResultSelf extends EventRecord<string, any> = {},
        TResultSync extends EventRecord<string, any> = {}
    >(
        event: TEvent,
        config: EventConfig<
            TContext,
            TData,
            TResultBroadcast,
            TResultSelf,
            TResultSync
        >
    ): PluvIO<
        TPlatform,
        TAuthorize,
        TContext,
        Spread<[TInput, EventRecord<TEvent, TData>]>,
        Spread<[TOutputBroadcast, TResultBroadcast]>,
        Spread<[TOutputSelf, TResultSelf]>,
        Spread<[TOutputSync, TResultSync]>
    > {
        if (event.startsWith("$")) {
            throw new Error('Event name must not start with "$".');
        }

        const newEvent = {
            [event]: config,
        } as InferEventConfig<
            TContext,
            EventRecord<TEvent, TData>,
            TResultBroadcast extends EventRecord<string, any>
                ? TResultBroadcast
                : {},
            TResultSelf extends EventRecord<string, any> ? TResultSelf : {},
            TResultSync extends EventRecord<string, any> ? TResultSync : {}
        >;

        /**
         * !HACK
         * @description Typing this is becoming way too unmanagable, due to resolver
         * being able to return void and needing to handle the conditional typing.
         * Assume the types will work out, and cast as any here.
         *
         * TODO
         * @description Revisit EventResolver and related types to resolve types
         * without casting to any.
         *
         * @author leedavidcs
         * @date September 25, 2022
         */
        return PluvIO.merge(
            this as any,
            new PluvIO({
                events: newEvent as any,
                platform: this._platform,
            })
        ) as any;
    }

    public getRoom(
        room: string,
        options: GetRoomOptions = {}
    ): IORoom<
        TPlatform,
        TAuthorize,
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    > {
        const { debug } = options;

        this._purgeEmptyRooms();

        if (!/^[a-z0-9]+[a-z0-9\-_]+[a-z0-9]+$/i.test(room)) {
            throw new Error("Unsupported room name");
        }

        const platform = this._platform;
        const oldRoom = this._rooms.get(room);

        if (oldRoom) return oldRoom;

        const newRoom = new IORoom<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            TOutputBroadcast,
            TOutputSelf,
            TOutputSync
        >(room, {
            authorize: this._authorize ?? undefined,
            context: this._context,
            debug: debug ?? this._debug,
            events: this._events,
            initialStorage: () => this._initialStorage?.(room),
            onDestroy: (encodedState) => {
                this._logDebug(
                    `${colors.blue("Deleting empty room:")} ${room}`
                );

                this._rooms.delete(room);
                this._listeners.onRoomDeleted(room, encodedState);

                if (this._debug) {
                    const rooms = Array.from(this._rooms.keys());

                    this._logDebug(`${colors.blue("Deleted room:")} ${room}`);
                    this._logDebug(
                        `${colors.blue("Rooms available:")} ${rooms.join(", ")}`
                    );
                }
            },
            platform,
        });

        this._rooms.set(room, newRoom);

        if (this._debug) {
            const rooms = Array.from(this._rooms.keys());

            this._logDebug(`${colors.blue("Created room:")} ${room}`);
            this._logDebug(
                `${colors.blue("Rooms available:")} ${rooms.join(", ")}`
            );
        }

        return newRoom;
    }

    public static merge<TIO1 extends PluvIO, TIO2 extends PluvIO>(
        first: TIO1,
        second: TIO2
    ): PluvIO<
        InferIOPlatform<TIO1>,
        InferIOAuthorize<TIO1>,
        InferIOContext<TIO1>,
        Spread<[InferIOInput<TIO1>, InferIOInput<TIO2>]>,
        Spread<[InferIOOutputBroadcast<TIO1>, InferIOOutputBroadcast<TIO2>]>,
        Spread<[InferIOOutputSelf<TIO1>, InferIOOutputSelf<TIO2>]>,
        Spread<[InferIOOutputSync<TIO1>, InferIOOutputSync<TIO2>]>
    > {
        const authorize = (first._authorize ??
            undefined) as InferIOAuthorize<TIO1>;
        const debug = first._debug;
        const platform = first._platform as InferIOPlatform<TIO1>;

        const events1 = first._events;
        const events2 = second._events;

        const events = Object.assign(Object.create(null), events1, events2);

        return new PluvIO({
            authorize,
            debug,
            events,
            platform,
        });
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _purgeEmptyRooms(): void {
        const rooms = Array.from(this._rooms.entries());

        rooms.forEach(([id, room]) => {
            if (room.getSize()) return;

            this._rooms.delete(id);
        });
    }
}

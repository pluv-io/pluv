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
import type {
    AbstractPlatform,
    InferPlatformRoomContextType,
} from "./AbstractPlatform";
import { IORoom, IORoomListenerEvent } from "./IORoom";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import type { EventConfig, InferEventConfig } from "./types";

type InferIOContext<TIO extends PluvIO<any, any, any, any, any, any, any>> =
    TIO extends PluvIO<any, any, infer IContext, any, any, any, any>
        ? IContext
        : never;

type InferIOPlatform<TIO extends PluvIO<any, any, any, any, any, any, any>> =
    TIO extends PluvIO<infer IPlatform, any, any, any, any, any, any>
        ? IPlatform
        : never;

export type InferIORoom<TIO extends PluvIO<any, any, any, any, any, any, any>> =
    TIO extends PluvIO<
        infer IPlatform,
        infer IAuthorize,
        infer IContext,
        infer IInput,
        infer IOutputBroadcast,
        infer IOutputSelf,
        infer IOutputSync
    >
        ? IORoom<
              IPlatform,
              IAuthorize,
              IContext,
              IInput,
              IOutputBroadcast,
              IOutputSelf,
              IOutputSync
          >
        : never;

type GetInitialStorageEvent<TPlatform extends AbstractPlatform> = {
    room: string;
} & InferPlatformRoomContextType<TPlatform>;

export type GetInitialStorageFn<TPlatform extends AbstractPlatform> = (
    event: GetInitialStorageEvent<TPlatform>
) => MaybePromise<Maybe<string>>;

export interface PluvIOListeners<TPlatform extends AbstractPlatform> {
    onRoomDeleted: (event: IORoomListenerEvent<TPlatform>) => void;
    onStorageUpdated: (event: IORoomListenerEvent<TPlatform>) => void;
}

export type PluvIOConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any> | null = null,
    TContext extends JsonObject = {},
    TInput extends EventRecord<string, any> = {},
    TOutputBroadcast extends EventRecord<string, any> = {},
    TOutputSelf extends EventRecord<string, any> = {},
    TOutputSync extends EventRecord<string, any> = {}
> = Partial<PluvIOListeners<TPlatform>> & {
    authorize?: TAuthorize;
    context?: TContext;
    debug?: boolean;
    events?: InferEventConfig<
        TPlatform,
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    >;
    getInitialStorage?: GetInitialStorageFn<TPlatform>;
    platform: TPlatform;
};

export type GetRoomOptions<TPlatform extends AbstractPlatform> = {
    debug?: boolean;
} & InferPlatformRoomContextType<TPlatform>;

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
    private _getInitialStorage: GetInitialStorageFn<TPlatform> | null = null;
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
        TPlatform,
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    > = {
        $GET_OTHERS: {
            resolver: {
                sync: (data, { room, session, sessions }) => {
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
            },
        },
        $INITIALIZE_SESSION: {
            resolver: {
                broadcast: ({ presence }, { session }) => {
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
                self: async ({ update }, { context, doc, room }) => {
                    const oldState =
                        await this._platform.persistance.getStorageState(room);

                    const updates: readonly Maybe<string>[] = [
                        oldState
                            ? null
                            : await this._getInitialStorage?.({
                                  ...context,
                                  room,
                              }),
                        update,
                    ];

                    if (updates.some((_update) => !!_update)) {
                        const encodedState = updates
                            .reduce((_doc, _up) => _doc.applyUpdate(_up), doc)
                            .encodeStateAsUpdate();

                        await this._platform.persistance.setStorageState(
                            room,
                            encodedState
                        );

                        this._listeners.onStorageUpdated({
                            ...context,
                            encodedState,
                            room,
                        });
                    }

                    const state =
                        (await this._platform.persistance.getStorageState(
                            room
                        )) ?? doc.encodeStateAsUpdate();

                    return { $STORAGE_RECEIVED: { state } };
                },
            },
        },
        $PING: {
            resolver: {
                self: (data, { session }) => {
                    if (!session) return {};

                    const currentTime = new Date().getTime();

                    session.timers.ping = currentTime;

                    return { $PONG: {} };
                },
            },
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
            resolver: ({ origin, update }, { context, doc, room }) => {
                if (
                    origin === "$INITIALIZED" &&
                    Object.keys(doc.toJSON()).length
                ) {
                    return;
                }

                const updated = doc.applyUpdate(update);
                const encodedState = updated.encodeStateAsUpdate();

                this._platform.persistance
                    .setStorageState(room, encodedState)
                    .then(() => {
                        this._listeners.onStorageUpdated({
                            ...context,
                            encodedState,
                            room,
                        });
                    });

                return { $STORAGE_UPDATED: { state: encodedState } };
            },
        },
    } as InferEventConfig<
        TPlatform,
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    >;
    readonly _listeners: PluvIOListeners<TPlatform>;
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
            getInitialStorage,
            onRoomDeleted,
            onStorageUpdated,
            platform,
        } = options;

        this._debug = debug;
        this._platform = platform;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
        if (events) this._events = events;
        if (getInitialStorage) this._getInitialStorage = getInitialStorage;

        this._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
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
            TPlatform,
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
            TPlatform,
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
        options: GetRoomOptions<TPlatform>
    ): IORoom<
        TPlatform,
        TAuthorize,
        TContext,
        TInput,
        TOutputBroadcast,
        TOutputSelf,
        TOutputSync
    > {
        const { debug, ...platformRoomContext } = options;

        this._purgeEmptyRooms();

        if (!/^[a-z0-9]+[a-z0-9\-_]+[a-z0-9]+$/i.test(room)) {
            throw new Error("Unsupported room name");
        }

        const platform = this._platform;
        const oldRoom = this._rooms.get(room);

        if (oldRoom) return oldRoom;

        const roomContext = {
            ...this._context,
            ...platformRoomContext,
        } as TContext & InferPlatformRoomContextType<TPlatform>;

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
            context: roomContext,
            debug: debug ?? this._debug,
            events: this._events,
            onDestroy: ({ encodedState, room }) => {
                this._logDebug(
                    `${colors.blue("Deleting empty room:")} ${room}`
                );

                const roomContext = {
                    room,
                    encodedState,
                    ...platformRoomContext,
                } as IORoomListenerEvent<TPlatform> &
                    InferPlatformRoomContextType<TPlatform>;

                this._rooms.delete(room);
                this._listeners.onRoomDeleted(roomContext);

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

        const { onRoomDeleted, onStorageUpdated } = first._listeners;

        const events = Object.assign(Object.create(null), events1, events2);

        return new PluvIO({
            authorize,
            debug,
            events,
            onRoomDeleted,
            onStorageUpdated,
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

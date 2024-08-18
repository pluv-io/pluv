import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    IOAuthorize,
    IORouterLike,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
} from "@pluv/types";
import colors from "kleur";
import type {
    AbstractPlatform,
    InferPlatformContextType,
    InferRoomContextType,
    WebSocketRegistrationMode,
} from "./AbstractPlatform";
import { IORoom } from "./IORoom";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type { GetInitialStorageFn, PluvIOListeners } from "./types";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any, any, any, any>> =
    TServer extends PluvServer<infer IPlatform, infer IAuthorize, infer IContext, infer IEvents>
        ? IORoom<IPlatform, IAuthorize, IContext, IEvents>
        : never;

export type PluvServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context?: TContext;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    getInitialStorage?: GetInitialStorageFn<TPlatform>;
    platform: TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

export type GetRoomOptions<TPlatform extends AbstractPlatform> = keyof InferRoomContextType<TPlatform> extends never
    ? [{ debug?: boolean }] | []
    : [Id<{ debug?: boolean } & InferRoomContextType<TPlatform>>];

export class PluvServer<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IORouterLike<TEvents>
{
    public _listeners: PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>;

    readonly _authorize: TAuthorize | null = null;
    readonly _context: TContext = {} as TContext;
    readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    readonly _debug: boolean;
    readonly _getInitialStorage: GetInitialStorageFn<TPlatform> | null = null;
    readonly _platform: TPlatform;
    readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
    readonly _version: string = __PLUV_VERSION as any;

    private _rooms = new Map<string, IORoom<TPlatform, TAuthorize, TContext, TEvents>>();

    private _baseRouter: PluvRouter<TPlatform, TAuthorize, TContext, {}> = new PluvRouter({
        $GET_OTHERS: this._procedure.sync((data, { room, session, sessions }) => {
            const currentTime = new Date().getTime();

            const others = sessions
                .filter((wsSession) => {
                    if (wsSession.id === session?.id) return false;
                    if (wsSession.quit) return false;
                    if (currentTime - wsSession.timers.ping > PING_TIMEOUT_MS) return false;

                    return true;
                })
                .reduce<{
                    [connectionId: string]: {
                        connectionId: string;
                        room: string | null;
                        user: JsonObject;
                    };
                }>(
                    (acc, { id, presence, user }) => ({
                        ...acc,
                        [id]: {
                            connectionId: id,
                            presence,
                            room,
                            user,
                        },
                    }),
                    {},
                );

            return { $OTHERS_RECEIVED: { others } };
        }),
        $INITIALIZE_SESSION: this._procedure
            .broadcast((data, { session }) => {
                const presence = (data as any)?.presence;

                if (!session) return {};

                session.presence = presence;

                return {
                    $USER_JOINED: {
                        connectionId: session.id,
                        user: session.user,
                        presence,
                    },
                };
            })
            .self(async (data, { context, doc, room }) => {
                const oldState = await this._platform.persistance.getStorageState(room);
                const update = (data as any)?.update as Maybe<string>;

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
                    const encodedState = doc.batchApplyEncodedState(updates).getEncodedState();

                    await this._platform.persistance.setStorageState(room, encodedState);

                    this._listeners.onStorageUpdated({ context, encodedState, room });
                }

                const state = (await this._platform.persistance.getStorageState(room)) ?? doc.getEncodedState();

                return { $STORAGE_RECEIVED: { state } };
            }),
        $PING: this._procedure.self((data, { session }) => {
            if (!session) return {};

            const currentTime = new Date().getTime();
            const prevState = session.webSocket.state;

            session.webSocket.state = {
                ...prevState,
                timers: {
                    ...prevState.timers,
                    ping: currentTime,
                },
            };

            return { $PONG: {} };
        }),
        $UPDATE_PRESENCE: this._procedure.broadcast((data, { session }) => {
            const presence = (data as any)?.presence;

            if (!session) return {};

            const updated = Object.assign(Object.create(null), session.presence, presence);

            session.webSocket.presence = updated;

            return { $PRESENCE_UPDATED: { presence: updated } };
        }),
        $UPDATE_STORAGE: this._procedure.broadcast((data, { context, doc, room }) => {
            const origin = (data as any)?.origin as Maybe<string>;
            const update: string | null = (data as any)?.update ?? null;

            if (origin === "$INITIALIZED" && Object.keys(doc.toJson()).length) {
                return {};
            }

            const updated = update === null ? doc : doc.applyEncodedState({ update });
            const encodedState = updated.getEncodedState();

            this._platform.persistance.setStorageState(room, encodedState).then(() => {
                this._listeners.onStorageUpdated({
                    context,
                    encodedState,
                    room,
                });
            });

            return { $STORAGE_UPDATED: { state: encodedState } };
        }),
    });

    public get _events() {
        return this._router._events;
    }

    public get _registrationMode(): WebSocketRegistrationMode {
        return this._platform._registrationMode;
    }

    private get _procedure(): PluvProcedure<TPlatform, TAuthorize, TContext, {}, {}> {
        return new PluvProcedure();
    }

    constructor(options: PluvServerConfig<TPlatform, TAuthorize, TContext, TEvents>) {
        const {
            authorize,
            context,
            crdt = noop,
            debug = false,
            getInitialStorage,
            onRoomDeleted,
            onRoomMessage,
            onStorageUpdated,
            platform,
            router = new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>({} as TEvents),
        } = options;

        this._crdt = crdt;
        this._debug = debug;
        this._platform = platform;
        this._router = (router ? this._baseRouter : PluvRouter.merge(this._baseRouter, router)) as PluvRouter<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
        if (getInitialStorage) this._getInitialStorage = getInitialStorage;

        this._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onRoomMessage: (event) => onRoomMessage?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
        };
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>, TPlatform>,
    ): Promise<string> {
        if (!this._authorize) {
            throw new Error("IO does not specify authorize during initialization.");
        }

        const ioAuthorize =
            typeof this._authorize === "function" ? this._authorize(params) : (this._authorize as { secret: string });

        const secret = ioAuthorize.secret;

        return await authorize({
            platform: this._platform,
            secret,
        }).encode(params);
    }

    public getRoom(
        room: string,
        ...options: GetRoomOptions<TPlatform>
    ): IORoom<TPlatform, TAuthorize, TContext, TEvents> {
        const { debug, ...platformRoomContext } = options[0] ?? {};

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
        } as TContext & InferRoomContextType<TPlatform>;

        const newRoom = new IORoom<TPlatform, TAuthorize, TContext, TEvents>(room, {
            authorize: this._authorize ?? undefined,
            context: roomContext,
            crdt: this._crdt,
            debug: debug ?? this._debug,
            onDestroy: async (event) => {
                this._logDebug(`${colors.blue("Deleting empty room:")} ${room}`);
                this._rooms.delete(room);

                await Promise.resolve(this._listeners.onRoomDeleted(event));
                await this._platform.persistance.deleteStorageState(room);

                if (this._debug) {
                    const rooms = Array.from(this._rooms.keys());

                    this._logDebug(`${colors.blue("Deleted room:")} ${room}`);
                    this._logDebug(`${colors.blue("Rooms available:")} ${rooms.join(", ")}`);
                }
            },
            onMessage: async (event) => {
                await Promise.resolve(this._listeners.onRoomMessage(event));
            },
            platform,
            router: this._router,
        });

        this._rooms.set(room, newRoom);

        if (this._debug) {
            const rooms = Array.from(this._rooms.keys());

            this._logDebug(`${colors.blue("Created room:")} ${room}`);
            this._logDebug(`${colors.blue("Rooms available:")} ${rooms.join(", ")}`);
        }

        return newRoom;
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }

    private _purgeEmptyRooms(): void {
        const rooms = Array.from(this._rooms.entries());

        rooms.forEach(([id, room]) => {
            if (!!room?.getSize()) return;

            this._rooms.delete(id);
        });
    }
}

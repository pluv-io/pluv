import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOLike, Id, InferIOAuthorize, InferIOAuthorizeUser, JsonObject, Maybe } from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferInitContextType, InferRoomContextType } from "./AbstractPlatform";
import type { IORoomListeners } from "./IORoom";
import { IORoom } from "./IORoom";
import type { PluvIO } from "./PluvIO";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type {
    BasePluvIOListeners,
    GetInitialStorageFn,
    PluvContext,
    PluvIOAuthorize,
    PluvIOLimits,
    PluvIOListeners,
} from "./types";
import { pickBy } from "./utils";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any, any, any, any>> =
    TServer extends PluvServer<infer IPlatform, infer IAuthorize, infer IContext, infer IEvents>
        ? IORoom<IPlatform, IAuthorize, IContext, IEvents>
        : never;

export type PluvServerConfig<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    getInitialStorage?: GetInitialStorageFn<TContext>;
    limits: PluvIOLimits;
    io: PluvIO<TPlatform, TAuthorize, TContext>;
    platform: TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

type BaseCreateRoomOptions<
    TPlatform extends AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = Partial<IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    debug?: boolean;
};

export type CreateRoomOptions<
    TPlatform extends AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = keyof InferRoomContextType<TPlatform> extends never
    ? [BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>] | []
    : [Id<BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents> & InferRoomContextType<TPlatform>>];

export class PluvServer<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TEvents>
{
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _authorize: TAuthorize = null as TAuthorize;
    private readonly _baseRouter: PluvRouter<TPlatform, TAuthorize, TContext, {}> = new PluvRouter({
        $getOthers: this._procedure.sync((data, { room, session, sessions }) => {
            const currentTime = Date.now();

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
                        user: JsonObject | null;
                    };
                }>(
                    (acc, { id, presence, timers, user }) => ({
                        ...acc,
                        [id]: {
                            connectionId: id,
                            presence,
                            room,
                            timers: { presence: timers.presence },
                            user,
                        },
                    }),
                    {},
                );

            return { $othersReceived: { others } };
        }),
        $initializeSession: this._procedure
            .broadcast((data, { session }) => {
                const presence = (data as any)?.presence;
                const timers = session.timers;

                if (!session) return {};

                session.presence = presence;

                return {
                    $userJoined: {
                        connectionId: session.id,
                        user: session.user,
                        presence,
                        timers: { presence: timers.presence },
                    },
                };
            })
            .self(async (data, { context, doc, room, session }) => {
                const oldState = await this._platform.persistence.getStorageState(room);
                const update = (data as any)?.update as Maybe<string>;

                const updates: readonly Maybe<string>[] = [
                    oldState ? null : await this._getInitialStorage?.({ context, room }),
                    update,
                ];

                if (updates.some((_update) => !!_update)) {
                    const encodedState = doc.batchApplyEncodedState(updates).getEncodedState();

                    await this._platform.persistence.setStorageState(room, encodedState);

                    this._getListeners().onStorageUpdated({
                        context,
                        encodedState,
                        room,
                        user: session?.user,
                        webSocket: session?.webSocket.webSocket,
                    });
                }

                const encodedState = (await this._platform.persistence.getStorageState(room)) ?? doc.getEncodedState();
                const storageSize = new TextEncoder().encode(encodedState).length;

                if (!!this._limits.storageMaxSize && storageSize > this._limits.storageMaxSize) {
                    throw new Error("Storage has exceeded the size limit");
                }

                return { $storageReceived: { state: encodedState } };
            }),
        $ping: this._procedure.self((data, { session }) => {
            if (!session) return {};

            const currentTime = new Date().getTime();
            const prevState = session.webSocket.state;

            this._platform.setSerializedState(session.webSocket, {
                ...prevState,
                timers: {
                    ...prevState.timers,
                    ping: currentTime,
                },
            });

            return { $pong: {} };
        }),
        $updatePresence: this._procedure.broadcast((data, context) => {
            const presence = (data as any)?.presence;
            const { session } = context;

            if (!session) return {};

            const cleanedPatch = pickBy(presence ?? {}, (value) => typeof value !== "undefined");
            const updated = Object.assign(Object.create(null), session.presence, cleanedPatch);
            const bytes = new TextEncoder().encode(JSON.stringify(updated)).length;

            if (!!this._limits.presenceMaxSize && bytes > this._limits.presenceMaxSize) {
                throw new Error(
                    `Large presence. Presence must be at most 512 bytes. Current size: ${bytes.toLocaleString()}`,
                );
            }

            context.presence = updated;

            return {
                $presenceUpdated: {
                    presence: updated,
                    timers: { presence: session.timers.presence },
                },
            };
        }),
        $updateStorage: this._procedure.broadcast((data, { context, doc, room }) => {
            const origin = (data as any)?.origin as Maybe<string>;
            const update: string | null = (data as any)?.update ?? null;

            if (origin === "$initialized" && Object.keys(doc.toJson()).length) return {};

            const updated = update === null ? doc : doc.applyEncodedState({ update });
            const encodedState = updated.getEncodedState();
            const storageSize = new TextEncoder().encode(encodedState).length;

            if (!!this._limits.storageMaxSize && storageSize > this._limits.storageMaxSize) {
                throw new Error("Storage has exceeded the size limit");
            }

            this._platform.persistence.setStorageState(room, encodedState).then(() => {
                this._getListeners().onStorageUpdated({
                    context,
                    encodedState,
                    room,
                });
            });

            return { $storageUpdated: { state: encodedState } };
        }),
    });
    private readonly _context: PluvContext<TPlatform, TContext> = {} as PluvContext<TPlatform, TContext>;
    private readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    private readonly _debug: boolean;
    private readonly _getInitialStorage: GetInitialStorageFn<TContext> | null = null;
    private readonly _io: PluvIO<TPlatform, TAuthorize, TContext>;
    private readonly _limits: PluvIOLimits;
    private readonly _platform: TPlatform;
    private readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;

    public get fetch(): (...args: any[]) => Promise<any> {
        return ((...args: any[]): Promise<any> => {
            if (!this._platform._fetch) throw new Error(`\`${this._platform._name}\` does not support \`fetch\``);

            return this._platform._fetch(...args);
        }) as NonNullable<typeof this._platform._fetch>;
    }

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
        } as {
            authorize: TAuthorize;
            context: TContext;
            events: TEvents;
            platform: TPlatform;
        };
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
            io,
            limits,
            platform,
            router = new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>({} as TEvents),
        } = options;

        const { onRoomDeleted, onRoomMessage, onStorageUpdated, onUserConnected, onUserDisconnected } =
            options as Partial<BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>>;

        platform.validateConfig(options);

        this._crdt = crdt;
        this._debug = debug;
        this._io = io;
        this._limits = limits;
        this._platform = platform;
        this._router = (router ? PluvRouter.merge(this._baseRouter, router) : this._baseRouter) as PluvRouter<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
        if (getInitialStorage) this._getInitialStorage = getInitialStorage;

        (this as any)._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onRoomMessage: (event) => onRoomMessage?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        } as BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>;
    }

    public createRoom(
        room: string,
        ...options: CreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>
    ): IORoom<TPlatform, TAuthorize, TContext, TEvents> {
        const { _meta, debug, onDestroy, onMessage, ...platformRoomContext } = (options[0] ?? {}) as CreateRoomOptions<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >[0] & { _meta?: any };

        if (this._platform._config.handleMode !== "io") {
            throw new Error(`\`createRoom\` is unsupported for \`${this._platform._name}\``);
        }

        if (!/^[a-z0-9]+[a-z0-9\-_]+[a-z0-9]+$/i.test(room)) throw new Error("Unsupported room name");

        const roomContext = platformRoomContext as InferRoomContextType<TPlatform>;
        const context: TContext = typeof this._context === "function" ? this._context(roomContext) : this._context;

        const newRoom = new IORoom<TPlatform, TAuthorize, TContext, TEvents>(room, {
            ...(!!_meta ? { _meta } : {}),
            authorize: this._authorize ?? undefined,
            context,
            crdt: this._crdt,
            debug: debug ?? this._debug,
            onDestroy: async (event) => {
                this._logDebug(`${colors.blue("Deleting empty room:")} ${room}`);

                await Promise.resolve(onDestroy?.(event));
                await Promise.resolve(this._getListeners().onRoomDeleted(event));
                await this._platform.persistence.deleteStorageState(room);

                this._logDebug(`${colors.blue("Deleted room:")} ${room}`);
            },
            onMessage: async (event) => {
                await Promise.resolve(onMessage?.(event));
                await Promise.resolve(this._getListeners().onRoomMessage(event));
            },
            onUserConnected: async (event) => {
                await Promise.resolve(this._getListeners().onUserConnected(event));
            },
            onUserDisconnected: async (event) => {
                await Promise.resolve(this._getListeners().onUserDisconnected(event));
            },
            platform: this._platform,
            roomContext,
            router: this._router,
        });

        this._logDebug(`${colors.blue("Created room:")} ${room}`);

        return newRoom;
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>, TPlatform>,
    ): Promise<string> {
        return await this._io.createToken(params);
    }

    private _getListeners(): BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents> {
        return (this as any)._listeners;
    }

    private _logDebug(...data: any[]): void {
        if (this._debug) console.log(...data);
    }
}

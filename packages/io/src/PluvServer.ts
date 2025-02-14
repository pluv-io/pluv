import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOLike, Id, InferIOAuthorize, InferIOAuthorizeUser, JsonObject, Maybe } from "@pluv/types";
import colors from "kleur";
import type { AbstractPlatform, InferInitContextType, InferRoomContextType } from "./AbstractPlatform";
import type { IORoomListeners, WebsocketRegisterConfig } from "./IORoom";
import { IORoom } from "./IORoom";
import { PluvProcedure } from "./PluvProcedure";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import { PING_TIMEOUT_MS } from "./constants";
import type {
    BasePluvIOListeners,
    GetInitialStorageFn,
    PluvContext,
    PluvIOAuthorize,
    PluvIOListeners,
    ResolvedPluvIOAuthorize,
} from "./types";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any, any, any, any>> =
    TServer extends PluvServer<infer IPlatform, infer IAuthorize, infer IContext, infer IEvents>
        ? IORoom<IPlatform, IAuthorize, IContext, IEvents>
        : never;

export type PluvServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    getInitialStorage?: GetInitialStorageFn<TContext>;
    platform: TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
};

type BaseCreateRoomOptions<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = Partial<IORoomListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    debug?: boolean;
};

export type CreateRoomOptions<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = keyof InferRoomContextType<TPlatform> extends never
    ? [BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>] | []
    : [Id<BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents> & InferRoomContextType<TPlatform>>];

export class PluvServer<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TEvents>
{
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _authorize: TAuthorize = null as TAuthorize;
    private readonly _baseRouter: PluvRouter<TPlatform, TAuthorize, TContext, {}> = new PluvRouter({
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
                        user: JsonObject | null;
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

                const state = (await this._platform.persistence.getStorageState(room)) ?? doc.getEncodedState();

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

            if (origin === "$INITIALIZED" && Object.keys(doc.toJson()).length) return {};

            const updated = update === null ? doc : doc.applyEncodedState({ update });
            const encodedState = updated.getEncodedState();

            this._platform.persistence.setStorageState(room, encodedState).then(() => {
                this._getListeners().onStorageUpdated({
                    context,
                    encodedState,
                    room,
                });
            });

            return { $STORAGE_UPDATED: { state: encodedState } };
        }),
    });
    private readonly _context: PluvContext<TPlatform, TContext> = {} as PluvContext<TPlatform, TContext>;
    private readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    private readonly _debug: boolean;
    private readonly _getInitialStorage: GetInitialStorageFn<TContext> | null = null;
    private readonly _platform: TPlatform;
    private readonly _router: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;

    public get fetch(): NonNullable<typeof this._platform._fetch> {
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

            platform,
            router = new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>({} as TEvents),
        } = options;

        const { onRoomDeleted, onRoomMessage, onStorageUpdated, onUserConnected, onUserDisconnected } =
            options as Partial<BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>>;

        platform.validateConfig(options);

        this._crdt = crdt;
        this._debug = debug;
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
            throw new Error(`\`createRoom\' is unsupported for \`${this._platform._name}\``);
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
        if (!this._authorize) {
            throw new Error("IO does not specify authorize during initialization.");
        }

        /**
         * !HACK
         * @description Allow the platform to overwrite this behavior as needed. This is introduced
         * to support platformPluv
         * @date December 15, 2024
         */
        if (this._platform._createToken) return await this._platform._createToken(params);

        const ioAuthorize = this._getIOAuthorize(params);
        const secret = ioAuthorize?.secret ?? null;

        if (!secret) throw new Error("`authorize` was specified without a valid secret");

        return await authorize({ platform: this._platform, secret }).encode(params as JWTEncodeParams<any, TPlatform>);
    }

    private _getIOAuthorize(options: WebsocketRegisterConfig<TPlatform>): ResolvedPluvIOAuthorize<any, any> | null {
        if (typeof this._authorize === "function") {
            return this._authorize(options);
        }

        return this._authorize as ResolvedPluvIOAuthorize<any, any> | null;
    }

    private _getListeners(): BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents> {
        return (this as any)._listeners;
    }

    private _logDebug(...data: any[]): void {
        this._debug && console.log(...data);
    }
}

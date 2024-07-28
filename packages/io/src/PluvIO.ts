import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    BaseIOAuthorize,
    IOAuthorize,
    IOLike,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
} from "@pluv/types";
import type { AbstractPlatform, InferPlatformContextType } from "./AbstractPlatform";
import { PluvProcedure } from "./PluvProcedure";
import type { MergedRouter, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import { PluvServer } from "./PluvServer";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import type { GetInitialStorageFn, PluvIOListeners } from "./types";
import { __PLUV_VERSION } from "./version";
import { PING_TIMEOUT_MS } from "./constants";

export type PluvIOConfig<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformContextType<TPlatform>>,
    TContext extends JsonObject,
> = Partial<PluvIOListeners<TPlatform>> & {
    authorize?: TAuthorize;
    context?: TContext;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    debug?: boolean;
    getInitialStorage?: GetInitialStorageFn<TPlatform>;
    platform: TPlatform;
};

export interface ServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> {
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
}

export class PluvIO<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
> implements IOLike<TAuthorize, {}>
{
    private _router: PluvRouter<TPlatform, TAuthorize, TContext, {}> = new PluvRouter({
        $GET_OTHERS: this.procedure.sync((data, { room, session, sessions }) => {
            const currentTime = new Date().getTime();

            const others = Array.from(sessions.entries())
                .filter(([, wsSession]) => {
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
                    (acc, [connectionId, { presence, user }]) => ({
                        ...acc,
                        [connectionId]: {
                            connectionId,
                            presence,
                            room,
                            user,
                        },
                    }),
                    {},
                );

            return { $OTHERS_RECEIVED: { others } };
        }),
        $INITIALIZE_SESSION: this.procedure
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

                    this._listeners.onStorageUpdated({ ...context, encodedState, room });
                }

                const state = (await this._platform.persistance.getStorageState(room)) ?? doc.getEncodedState();

                return { $STORAGE_RECEIVED: { state } };
            }),
        $PING: this.procedure.self((data, { session }) => {
            if (!session) return {};

            const currentTime = new Date().getTime();

            session.timers.ping = currentTime;

            return { $PONG: {} };
        }),
        $UPDATE_PRESENCE: this.procedure.broadcast((data, { session }) => {
            const presence = (data as any)?.presence;

            if (!session) return {};

            session.presence = Object.assign(Object.create(null), session.presence, presence);

            return { $PRESENCE_UPDATED: { presence } };
        }),
        $UPDATE_STORAGE: this.procedure.broadcast((data, { context, doc, room }) => {
            const origin = (data as any)?.origin as Maybe<string>;
            const update: string | null = (data as any)?.update ?? null;

            if (origin === "$INITIALIZED" && Object.keys(doc.toJson()).length) {
                return {};
            }

            const updated = update === null ? doc : doc.applyEncodedState({ update });
            const encodedState = updated.getEncodedState();

            this._platform.persistance.setStorageState(room, encodedState).then(() => {
                this._listeners.onStorageUpdated({
                    ...context,
                    encodedState,
                    room,
                });
            });

            return { $STORAGE_UPDATED: { state: encodedState } };
        }),
    });

    readonly _authorize: TAuthorize | null = null;
    readonly _context: TContext = {} as TContext;
    readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    readonly _debug: boolean;
    readonly _getInitialStorage: GetInitialStorageFn<TPlatform> | null = null;
    readonly _listeners: PluvIOListeners<TPlatform>;
    readonly _platform: TPlatform;
    readonly _version: string = __PLUV_VERSION as any;

    public get _events() {
        return this._router._events;
    }

    public get procedure(): PluvProcedure<TPlatform, TAuthorize, TContext, {}, {}> {
        return new PluvProcedure();
    }

    constructor(options: PluvIOConfig<TPlatform, TAuthorize, TContext>) {
        const {
            authorize,
            context,
            crdt = noop,
            debug = false,
            getInitialStorage,
            onRoomDeleted,
            onStorageUpdated,
            platform,
        } = options;

        this._crdt = crdt;
        this._debug = debug;
        this._platform = platform;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
        if (getInitialStorage) this._getInitialStorage = getInitialStorage;

        this._listeners = {
            onRoomDeleted: (event) => onRoomDeleted?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
        };
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>, TPlatform>,
    ): Promise<string> {
        if (!this._authorize) throw new Error("IO does not specify authorize during initialization.");

        const ioAuthorize =
            typeof this._authorize === "function" ? this._authorize(params) : (this._authorize as { secret: string });

        const secret = ioAuthorize.secret;

        return await authorize({
            platform: this._platform,
            secret,
        }).encode(params);
    }

    public mergeRouters<TRouters extends PluvRouter<TPlatform, TAuthorize, TContext, any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        return PluvRouter.merge(...routers);
    }

    public router<TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>>(
        events: TEvents,
    ): PluvRouter<TPlatform, TAuthorize, TContext, TEvents> {
        return new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>(events);
    }

    public server<TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>>(
        config: ServerConfig<TPlatform, TAuthorize, TContext, TEvents> = {},
    ): PluvServer<TPlatform, TAuthorize, TContext, TEvents> {
        const router = (config.router ? this.mergeRouters(this._router, config.router) : this._router) as PluvRouter<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >;

        return new PluvServer<TPlatform, TAuthorize, TContext, TEvents>({
            ...this._listeners,
            authorize: this._authorize ?? undefined,
            context: this._context,
            crdt: this._crdt,
            debug: this._debug,
            platform: this._platform,
            router,
        });
    }
}

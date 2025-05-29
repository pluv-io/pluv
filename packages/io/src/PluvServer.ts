import type { AbstractCrdtDocFactory, CrdtLibraryType, NoopCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type {
    IOLike,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    JsonObject,
    Maybe,
    NonNilProps,
} from "@pluv/types";
import colors from "kleur";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferRoomContextType,
} from "./AbstractPlatform";
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
import { oneLine, pickBy } from "./utils";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any, any, any, any, any>> =
    TServer extends PluvServer<
        infer IPlatform,
        infer IAuthorize,
        infer IContext,
        infer ICrdt,
        infer IEvents
    >
        ? IORoom<IPlatform, IAuthorize, IContext, ICrdt, IEvents>
        : never;

export type PluvServerConfig<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<
        TPlatform,
        any,
        InferInitContextType<TPlatform>
    > | null = any,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize?: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any, any> };
    debug?: boolean;
    limits: PluvIOLimits;
    io: PluvIO<TPlatform, TAuthorize, TContext>;
    platform: () => TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
} & (TCrdt extends CrdtLibraryType<NoopCrdtDocFactory>
        ? { getInitialStorage?: "[ERROR]: Must specify crdt to use getInitialStorage" }
        : { getInitialStorage: GetInitialStorageFn<TContext> });

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
    : [
          Id<
              BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents> &
                  InferRoomContextType<TPlatform>
          >,
      ];

export class PluvServer<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<
        TPlatform,
        any,
        InferInitContextType<TPlatform>
    > | null = any,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TCrdt, TEvents>
{
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _config: NonNilProps<
        PluvServerConfig<TPlatform, TAuthorize, TContext, TCrdt, TEvents>
    >;

    public get fetch(): (...args: any[]) => Promise<any> {
        return (...args: any[]): Promise<any> => {
            const platform = this._config.platform();
            platform.validateConfig(this._config);

            if (!platform._fetch) {
                throw new Error(`\`${platform._name}\` does not support \`fetch\``);
            }

            return platform._fetch(...args);
        };
    }

    /**
     * @ignore
     * @readonly
     * @deprecated Internal use only. Changes to this will never be marked as breaking.
     */
    public get _defs() {
        return {
            authorize: this._config.authorize,
            context: this._config.context,
            crdt: this._config.crdt,
            events: this._router._defs.events,
            platform: this._config.platform(),
        } as {
            authorize: TAuthorize;
            context: TContext;
            crdt: TCrdt;
            events: TEvents;
            platform: TPlatform;
        };
    }

    private get _baseRouter(): PluvRouter<TPlatform, TAuthorize, TContext, {}> {
        const listeners = this._getListeners();

        return new PluvRouter({
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
                .self(async (data, { context, doc, platform, room, session }) => {
                    const oldState = await platform.persistence.getStorageState(room);
                    /**
                     * !HACK
                     * @description This is the frontend's initialStorage. We only want to
                     * apply this if the server's storage is empty (i.e. no initial storage
                     * has been applied)
                     */
                    const update = (data as any)?.update as Maybe<string>;

                    if (!oldState) {
                        const loadedState = await this._getInitialStorage({ context, room });

                        const checkDoc = this._config.crdt
                            .doc(() => ({}))
                            .getEmpty()
                            .applyEncodedState({ update: loadedState });
                        const isEmpty = checkDoc.isEmpty();
                        checkDoc.destroy();

                        if (!!loadedState && !isEmpty) {
                            doc.applyEncodedState({ update: loadedState }).getEncodedState();
                        }
                    }

                    /**
                     * @description Storage was already initialized. Don't overwrite the current
                     * storage state with the incoming initial storage. Return what the current state
                     * is without changes.
                     * @date May 7, 2025
                     */
                    if (!doc.isEmpty()) {
                        const encodedState = doc.getEncodedState();

                        return {
                            $storageReceived: { changeKind: "unchanged", state: encodedState },
                        };
                    }

                    /**
                     * @description Storage was never initialized, and there is an incoming
                     * initialStorage from the client. Apply the initialStorage and persist the state
                     * as an update.
                     * @date May 7, 2025
                     */
                    if (!!update) {
                        const encodedState = doc.applyEncodedState({ update }).getEncodedState();
                        const storageSize = new TextEncoder().encode(encodedState).length;

                        if (
                            !!this._config.limits.storageMaxSize &&
                            storageSize > this._config.limits.storageMaxSize
                        ) {
                            throw new Error("Storage has exceeded the size limit");
                        }

                        await platform.persistence
                            .setStorageState(room, encodedState)
                            .catch((error) => {
                                this._logDebug(error);
                            });

                        listeners.onStorageUpdated({
                            context,
                            encodedState,
                            platform,
                            room,
                            user: session?.user,
                            webSocket: session?.webSocket.webSocket,
                        });

                        return {
                            $storageReceived: { changeKind: "initialized", state: encodedState },
                        };
                    }

                    const encodedState = doc.getEncodedState();

                    return { $storageReceived: { changeKind: "empty", state: encodedState } };
                }),
            $ping: this._procedure.self((data, { platform, session }) => {
                if (!session) return {};

                const currentTime = new Date().getTime();
                const prevState = session.webSocket.state;

                platform.setSerializedState(session.webSocket, {
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

                const cleanedPatch = pickBy(
                    presence ?? {},
                    (value) => typeof value !== "undefined",
                );
                const updated = Object.assign(Object.create(null), session.presence, cleanedPatch);
                const bytes = new TextEncoder().encode(JSON.stringify(updated)).length;

                if (
                    !!this._config.limits.presenceMaxSize &&
                    bytes > this._config.limits.presenceMaxSize
                ) {
                    throw new Error(oneLine`
                        Large presence. Presence must be at most
                        ${this._config.limits.presenceMaxSize.toLocaleString()} bytes.
                        Current size: ${bytes.toLocaleString()} bytes
                    `);
                }

                context.presence = updated;

                return {
                    $presenceUpdated: {
                        presence: updated,
                        timers: { presence: session.timers.presence },
                    },
                };
            }),
            $updateStorage: this._procedure.broadcast((data, { context, doc, platform, room }) => {
                const origin = (data as any)?.origin as Maybe<string>;
                const update: string | null = (data as any)?.update ?? null;

                if (origin === "$initialized" && Object.keys(doc.toJson()).length) return {};

                const updated = update === null ? doc : doc.applyEncodedState({ update });
                const encodedState = updated.getEncodedState();
                const storageSize = new TextEncoder().encode(encodedState).length;

                if (
                    !!this._config.limits.storageMaxSize &&
                    storageSize > this._config.limits.storageMaxSize
                ) {
                    throw new Error(oneLine`
                        Large Storage. Storage must be at most
                        ${this._config.limits.storageMaxSize.toLocaleString()} bytes.
                        Current size: ${storageSize.toLocaleString()} bytes
                    `);
                }

                platform.persistence.setStorageState(room, encodedState).then(() => {
                    listeners.onStorageUpdated({
                        context,
                        encodedState,
                        platform,
                        room,
                    });
                });

                return { $storageUpdated: { state: encodedState } };
            }),
        });
    }

    private get _procedure(): PluvProcedure<TPlatform, TAuthorize, TContext, {}, {}> {
        return new PluvProcedure();
    }

    private get _router(): PluvRouter<TPlatform, TAuthorize, TContext, TEvents> {
        return (
            this._config.router
                ? PluvRouter.merge(this._baseRouter, this._config.router)
                : this._baseRouter
        ) as PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
    }

    constructor(options: PluvServerConfig<TPlatform, TAuthorize, TContext, TCrdt, TEvents>) {
        this._config = {
            crdt: noop,
            debug: false,
            router: new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>({} as TEvents),
            ...options,
        } as NonNilProps<PluvServerConfig<TPlatform, TAuthorize, TContext, TCrdt, TEvents>>;

        const {
            onRoomDeleted,
            onRoomMessage,
            onStorageUpdated,
            onUserConnected,
            onUserDisconnected,
        } = options as Partial<BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>>;

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
    ): IORoom<TPlatform, TAuthorize, TContext, TCrdt, TEvents> {
        const { _meta, debug, onDestroy, onMessage, ...platformRoomContext } = (options[0] ??
            {}) as CreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>[0] & { _meta?: any };

        const platform = this._config.platform();

        platform.validateConfig(this._config);

        if (platform._config.handleMode !== "io") {
            throw new Error(`\`createRoom\` is unsupported for \`${platform._name}\``);
        }

        if (!/^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/i.test(room))
            throw new Error("Unsupported room name");

        const roomContext = platformRoomContext as InferRoomContextType<TPlatform>;
        const context: TContext =
            typeof this._config.context === "function"
                ? this._config.context(roomContext)
                : this._config.context;
        const listeners = this._getListeners();
        const logDebug = this._logDebug.bind(this);

        const newRoom = new IORoom<TPlatform, TAuthorize, TContext, TCrdt, TEvents>(room, {
            ...(!!_meta ? { _meta } : {}),
            authorize: this._config.authorize ?? undefined,
            context,
            crdt: this._config.crdt,
            debug: debug ?? this._config.debug,
            async onDestroy(event) {
                logDebug(`${colors.blue("Deleting empty room:")} ${room}`);

                await Promise.resolve(onDestroy?.(event));
                await Promise.resolve(listeners.onRoomDeleted(event));
                await event.platform.persistence.deleteStorageState(room);

                logDebug(`${colors.blue("Deleted room:")} ${room}`);
            },
            async onMessage(event) {
                await Promise.resolve(onMessage?.(event));
                await Promise.resolve(listeners.onRoomMessage(event));
            },
            async onUserConnected(event) {
                await Promise.resolve(listeners.onUserConnected(event));
            },
            async onUserDisconnected(event) {
                await Promise.resolve(listeners.onUserDisconnected(event));
            },
            platform,
            roomContext,
            router: this._router,
        });

        this._logDebug(`${colors.blue("Created room:")} ${room}`);

        return newRoom;
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<InferIOAuthorize<this>>, TPlatform>,
    ): Promise<string> {
        return await this._config.io.createToken(params);
    }

    private _getInitialStorage: GetInitialStorageFn<TContext> = (...args) => {
        const getInitialStorage =
            typeof this._config.getInitialStorage !== "string"
                ? (this._config.getInitialStorage ??
                  ((() => null) as GetInitialStorageFn<TContext>))
                : ((() => null) as GetInitialStorageFn<TContext>);

        return getInitialStorage(...args);
    };

    private _getListeners(): BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents> {
        return (this as any)._listeners;
    }

    private _logDebug(...data: any[]): void {
        if (this._config.debug) console.log(...data);
    }
}

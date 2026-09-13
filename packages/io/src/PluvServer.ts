import type { AbstractCrdtDocFactory, CrdtLibraryType, HasCrdtLibrary } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOLike, Id, InferIOAuthorize, InferIOAuthorizeUser, NonNilProps } from "@pluv/types";
import colors from "kleur";
import type {
    AbstractPlatform,
    InferInitContextType,
    InferRoomContextType,
} from "./AbstractPlatform";
import { createBaseRouter } from "./createBaseRouter";
import { IORoom } from "./IORoom";
import type { PluvIO } from "./PluvIO";
import type { PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import type {
    BasePluvIOListeners,
    GetInitialStorageFn,
    PluvContext,
    PluvIOAuthorize,
    PluvIOLimits,
    PluvIOListeners,
} from "./types";
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
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> = any,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> & {
    authorize: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any, any> };
    debug?: boolean;
    limits: PluvIOLimits;
    io: PluvIO<TPlatform, TAuthorize, TContext>;
    platform: () => TPlatform;
    router?: PluvRouter<TPlatform, TAuthorize, TContext, TEvents>;
} & (HasCrdtLibrary<TCrdt> extends true
        ? { getInitialStorage: GetInitialStorageFn<TContext> }
        : { getInitialStorage?: "[ERROR]: Must specify crdt to use getInitialStorage" });

type BaseCreateRoomOptions<
    TPlatform extends AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = {
    debug?: boolean;
};

export type CreateRoomOptions<
    TPlatform extends AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>>,
    TContext extends Record<string, any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>,
> = keyof Omit<InferRoomContextType<TPlatform>, "meta"> extends never
    ? [BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>] | []
    : [
          Id<
              BaseCreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents> &
                  InferRoomContextType<TPlatform>
          >,
      ];

export class PluvServer<
    TPlatform extends AbstractPlatform<any, any> = AbstractPlatform<any, any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> = any,
    TContext extends Record<string, any> = {},
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IOLike<TAuthorize, TCrdt, TEvents> {
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _config: NonNilProps<
        PluvServerConfig<TPlatform, TAuthorize, TContext, TCrdt, TEvents>
    >;
    private readonly _docFactory: AbstractCrdtDocFactory<any, any>;

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
            context: PluvContext<TPlatform, TContext>;
            crdt: TCrdt;
            events: TEvents;
            platform: TPlatform;
        };
    }

    private get _baseRouter(): PluvRouter<TPlatform, TAuthorize, TContext, {}> {
        const listeners = this._getListeners();

        return createBaseRouter<TPlatform, TAuthorize, TContext>({
            limits: this._config.limits,
            logDebug: (...data) => this._logDebug(...data),
            onStorageUpdated: (event) => listeners.onStorageUpdated(event),
        });
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
            onRoomDestroyed,
            onRoomMessage,
            onStorageDestroyed,
            onStorageUpdated,
            onUserConnected,
            onUserDisconnected,
        } = options as Partial<BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>>;

        this._docFactory = this._config.crdt.doc(() => ({}));
        (this as any)._listeners = {
            onRoomDestroyed: (event) => onRoomDestroyed?.(event),
            onRoomMessage: (event) => onRoomMessage?.(event),
            onStorageDestroyed: (event) => onStorageDestroyed?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        } as BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>;
    }

    public createRoom(
        room: string,
        ...options: CreateRoomOptions<TPlatform, TAuthorize, TContext, TEvents>
    ): IORoom<TPlatform, TAuthorize, TContext, TCrdt, TEvents> {
        const { _meta, debug, ...platformRoomContext } = (options[0] ?? {}) as CreateRoomOptions<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >[0] & {
            _meta?: any;
        };

        const platform = this._config.platform();

        platform.validateConfig(this._config);

        if (platform._config.handleMode !== "io") {
            throw new Error(`\`createRoom\` is unsupported for \`${platform._name}\``);
        }

        if (!/^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/i.test(room))
            throw new Error("Unsupported room name");

        const roomContext = platformRoomContext as InferRoomContextType<TPlatform>;
        const listeners = this._getListeners();
        const logDebug = this._logDebug.bind(this);

        const newRoom = new IORoom<TPlatform, TAuthorize, TContext, TCrdt, TEvents>(room, {
            ...(!!_meta ? { _meta } : {}),
            authorize: this._config.authorize,
            context: this._config.context,
            crdt: this._config.crdt,
            debug: debug ?? this._config.debug,
            getInitialStorage: this._getInitialStorage,
            async onRoomDestroyed(event) {
                logDebug(`${colors.blue("Deleting empty room:")} ${room}`);

                // Always fire server-level onRoomDestroyed
                await Promise.resolve(listeners.onRoomDestroyed(event));

                logDebug(`${colors.blue("Deleted room:")} ${room}`);
            },
            async onStorageDestroyed(event) {
                logDebug(`${colors.blue("Destroying storage for room:")} ${room}`);

                // Always fire server-level onStorageDestroyed
                await Promise.resolve(listeners.onStorageDestroyed(event));

                await event.platform.persistence.deleteStorageState(room);

                logDebug(`${colors.blue("Destroyed storage for room:")} ${room}`);
            },
            async onMessage(event) {
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
        const getInitialStorage = this._config.getInitialStorage;

        if (typeof getInitialStorage !== "function") return null;

        return getInitialStorage(...args);
    };

    private _getListeners(): BasePluvIOListeners<TPlatform, TAuthorize, TContext, TEvents> {
        return (this as any)._listeners;
    }

    private _logDebug(...data: any[]): void {
        if (this._config.debug) console.log(...data);
    }
}

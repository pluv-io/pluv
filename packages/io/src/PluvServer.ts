import type { AbstractCrdtDocFactory, CrdtLibraryType, HasCrdtLibrary } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOLike, Id, InferIOAuthorizeUser, NonNilProps } from "@pluv/types";
import colors from "kleur";
import type { InferRoomContextType } from "./AbstractPlatform";
import { createBaseRouter } from "./createBaseRouter";
import type { IODefs, IOLikeFromDefs, SetKey } from "./IODefs";
import { IORoom } from "./IORoom";
import type { PluvIO } from "./PluvIO";
import { PluvRouter } from "./PluvRouter";
import type { JWTEncodeParams } from "./authorize";
import type {
    BasePluvIOListeners,
    GetInitialStorageFn,
    PluvContext,
    PluvIOLimits,
    PluvIOListeners,
} from "./types";
import { __PLUV_VERSION } from "./version";

export type InferIORoom<TServer extends PluvServer<any>> =
    TServer extends PluvServer<infer IDefs extends IODefs> ? IORoom<IDefs> : never;

export type PluvServerConfig<T extends IODefs = IODefs> = Partial<PluvIOListeners<T>> & {
    authorize: T["authorize"];
    context?: PluvContext<T["platform"], T["context"]>;
    crdt?: { doc: (value: any) => AbstractCrdtDocFactory<any, any> };
    debug?: boolean;
    limits: PluvIOLimits;
    io: PluvIO<SetKey<T, "events", {}>>;
    platform: () => T["platform"];
    router?: PluvRouter<T>;
} & (HasCrdtLibrary<T["crdt"]> extends true
        ? { getInitialStorage: GetInitialStorageFn<T["context"]> }
        : { getInitialStorage?: "[ERROR]: Must specify crdt to use getInitialStorage" });

type BaseCreateRoomOptions<T extends IODefs> = {
    debug?: boolean;
};

export type CreateRoomOptions<T extends IODefs = IODefs> = keyof Omit<
    InferRoomContextType<T["platform"]>,
    "meta"
> extends never
    ? [BaseCreateRoomOptions<T>] | []
    : [Id<BaseCreateRoomOptions<T> & InferRoomContextType<T["platform"]>>];

export class PluvServer<T extends IODefs = IODefs> implements IOLike<IOLikeFromDefs<T>> {
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _config: NonNilProps<PluvServerConfig<T>>;
    private readonly _docFactory: AbstractCrdtDocFactory<any, any>;
    private readonly _listeners: BasePluvIOListeners<T>;

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
        } as T;
    }

    private get _baseRouter(): PluvRouter<SetKey<T, "events", {}>> {
        return createBaseRouter<T>({
            limits: this._config.limits,
            logDebug: (...data) => this._logDebug(...data),
            onStorageUpdated: (event) => this._listeners.onStorageUpdated(event),
        }) as PluvRouter<SetKey<T, "events", {}>>;
    }

    private get _router(): PluvRouter<T> {
        return (
            this._config.router
                ? PluvRouter.merge(this._baseRouter, this._config.router)
                : this._baseRouter
        ) as PluvRouter<T>;
    }

    constructor(options: PluvServerConfig<T>) {
        this._config = {
            crdt: noop,
            debug: false,
            router: new PluvRouter<T>({} as T["events"]),
            ...options,
        } as NonNilProps<PluvServerConfig<T>>;

        const {
            onRoomDestroyed,
            onRoomMessage,
            onStorageDestroyed,
            onStorageUpdated,
            onUserConnected,
            onUserDisconnected,
        } = options as Partial<BasePluvIOListeners<T>>;

        this._docFactory = this._config.crdt.doc(() => ({}));
        this._listeners = {
            onRoomDestroyed: (event) => onRoomDestroyed?.(event),
            onRoomMessage: (event) => onRoomMessage?.(event),
            onStorageDestroyed: (event) => onStorageDestroyed?.(event),
            onStorageUpdated: (event) => onStorageUpdated?.(event),
            onUserConnected: (event) => onUserConnected?.(event),
            onUserDisconnected: (event) => onUserDisconnected?.(event),
        };
    }

    public createRoom(room: string, ...options: CreateRoomOptions<T>): IORoom<T> {
        const { _meta, debug, ...platformRoomContext } = (options[0] ??
            {}) as CreateRoomOptions<T>[0] & {
            _meta?: any;
        };

        const platform = this._config.platform();

        platform.validateConfig(this._config);

        if (platform._config.handleMode !== "io") {
            throw new Error(`\`createRoom\` is unsupported for \`${platform._name}\``);
        }

        if (!/^[a-z0-9](?:[a-z0-9-_]*[a-z0-9])?$/i.test(room))
            throw new Error("Unsupported room name");

        const roomContext = platformRoomContext as InferRoomContextType<T["platform"]>;
        const listeners = this._listeners;
        const logDebug = this._logDebug.bind(this);

        const newRoom = new IORoom<T>(room, {
            ...(!!_meta ? { _meta } : {}),
            authorize: this._config.authorize,
            context: this._config.context,
            crdt: this._config.crdt,
            debug: debug ?? this._config.debug,
            getInitialStorage: this._getInitialStorage,
            limits: this._config.limits,
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
        params: JWTEncodeParams<InferIOAuthorizeUser<T["authorize"]>, T["platform"]>,
    ): Promise<string> {
        return await this._config.io.createToken(params);
    }

    private _getInitialStorage: GetInitialStorageFn<T["context"]> = (...args) => {
        const getInitialStorage = this._config.getInitialStorage;

        if (typeof getInitialStorage !== "function") return null;

        return getInitialStorage(...args);
    };

    private _logDebug(...data: any[]): void {
        if (this._config.debug) console.log(...data);
    }
}

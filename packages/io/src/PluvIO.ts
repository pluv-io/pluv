import type { HasStorage } from "@pluv/crdt";
import type { HasRequiredProperty, InferTreatyUser, SetKey } from "@pluv/types";
import type { InferInitContextType } from "./AbstractPlatform";
import type { IODefs } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { MergedRouter, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import { PluvServer, PluvServerConfig } from "./PluvServer";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import {
    DEFAULT_MAX_CONNECTIONS,
    MAX_PRESENCE_SIZE_BYTES,
    MAX_STORAGE_SIZE_BYTES,
    MAX_USER_ID_LENGTH,
    MAX_USER_SIZE_BYTES,
} from "./constants";
import type {
    GetInitialStorageFn,
    PluvContext,
    PluvIOLimits,
    PluvIOListeners,
    PluvIORouter,
    PluvIOSecret,
} from "./types";
import { oneLine, parsePluvSchema, resolveIOSecret, assertPresenceFanoutBudget } from "./utils";
import { __PLUV_VERSION } from "./version";

export type PluvIOConfig<T extends IODefs = IODefs> = {
    context?: PluvContext<T["platform"], T["context"]>;
    debug?: boolean;
    limits?: PluvIOLimits;
    platform: () => T["platform"];
    secret?: PluvIOSecret<T["platform"]>;
    treaty: T["treaty"];
};

type ResolvedServerConfig<T extends IODefs = IODefs> = Partial<PluvIOListeners<T>> &
    PluvIORouter<T> &
    (HasStorage<T["treaty"]["storage"]> extends true
        ? { getInitialStorage: GetInitialStorageFn<T["context"]> }
        : {
              getInitialStorage?: "[ERROR]: Must specify storage on treaty to use getInitialStorage";
          });

export type BaseServerConfig<T extends IODefs = IODefs> = {
    [
        P in keyof ResolvedServerConfig<T> as ResolvedServerConfig<T>[P] extends undefined
            ? never
            : P
    ]: ResolvedServerConfig<T>[P];
};

export type ServerConfig<T extends IODefs = IODefs> =
    HasRequiredProperty<BaseServerConfig<T>> extends true
        ? [BaseServerConfig<T>]
        : [BaseServerConfig<T>?];

export class PluvIO<T extends IODefs = IODefs> {
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _context: PluvContext<T["platform"], T["context"]> = {} as PluvContext<
        T["platform"],
        T["context"]
    >;
    private readonly _debug: boolean;
    private readonly _limits: PluvIOLimits;
    private readonly _platform: () => T["platform"];
    private readonly _secret?: PluvIOSecret<T["platform"]>;
    private readonly _treaty: T["treaty"];

    public get procedure(): PluvProcedure<T, {}, {}> {
        return new PluvProcedure();
    }

    constructor(options: PluvIOConfig<T>) {
        const { context, debug = false, limits, platform, secret, treaty } = options;

        this._debug = debug;
        this._limits = {
            dangerouslyAllowHighPresenceFanout: false,
            maxConnections: DEFAULT_MAX_CONNECTIONS,
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            storageMaxSize: MAX_STORAGE_SIZE_BYTES,
            userIdMaxLength: MAX_USER_ID_LENGTH,
            userMaxSize: MAX_USER_SIZE_BYTES,
            ...limits,
        };
        this._platform = platform;
        this._secret = secret;
        this._treaty = treaty;

        if (context) this._context = context;

        assertPresenceFanoutBudget(this._limits);
    }

    public async createToken(
        params: JWTEncodeParams<InferTreatyUser<T["treaty"]>, T["platform"]>,
    ): Promise<string> {
        const platform = this._platform();
        const { maxAge, room, user, ...initRest } = params;
        const initContext = platform.normalizeInitContext(
            initRest as InferInitContextType<T["platform"]>,
        );
        const authorizeParams = { ...params, ...initContext };
        const secret = resolveIOSecret(this._secret, authorizeParams);
        const parsed = parsePluvSchema(this._treaty.user, user);

        if (!!this._limits.userIdMaxLength && user.id.length > this._limits.userIdMaxLength) {
            throw new Error(oneLine`
                createToken was called with a long user id. User ID must be at
                most ${this._limits.userIdMaxLength.toLocaleString()} characters.
                Current length: ${user.id.length.toLocaleString()}
            `);
        }

        const bytes = new TextEncoder().encode(JSON.stringify(parsed)).length;

        if (!!this._limits.userMaxSize && bytes > this._limits.userMaxSize) {
            throw new Error(oneLine`
                createToken called with large payload. User must be at most
                ${this._limits.userMaxSize.toLocaleString()} bytes. Current size:
                ${bytes.toLocaleString()} bytes
            `);
        }

        const ioAuthorize = { user: this._treaty.user, secret };

        if (platform._createToken) {
            return await platform._createToken({ ...authorizeParams, authorize: ioAuthorize });
        }

        if (!secret) throw new Error("`secret` was not provided");

        return await authorize({ platform, secret }).encode(
            authorizeParams as JWTEncodeParams<any, T["platform"]>,
        );
    }

    public mergeRouters<TRouters extends PluvRouter<SetKey<T, "events", any>>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters, T> {
        return PluvRouter.merge(...routers) as MergedRouter<TRouters, T>;
    }

    public router<TEvents extends PluvRouterEventConfig<T>>(
        events: TEvents,
    ): PluvRouter<SetKey<T, "events", TEvents>> {
        return new PluvRouter<SetKey<T, "events", TEvents>>(events);
    }

    public server<TEvents extends PluvRouterEventConfig<T> = {}>(
        ...config: ServerConfig<SetKey<T, "events", TEvents>>
    ): PluvServer<SetKey<T, "events", TEvents>> {
        const serverConfig = (config[0] ?? {}) as PluvServerConfig<SetKey<T, "events", TEvents>>;

        return new PluvServer<SetKey<T, "events", TEvents>>({
            ...serverConfig,
            context: this._context,
            debug: this._debug,
            io: this,
            limits: this._limits,
            platform: this._platform,
            secret: this._secret,
            treaty: this._treaty,
        });
    }
}

import type { AbstractCrdtDocFactory, CrdtLibraryType, HasCrdtLibrary } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { BaseUser, HasRequiredProperty, InferIOAuthorizeUser, SetKey } from "@pluv/types";
import type { InferInitContextType } from "./AbstractPlatform";
import type { IODefs } from "./IODefs";
import type { WebSocketRegisterConfig } from "./IORoom";
import { PluvProcedure } from "./PluvProcedure";
import type { MergedRouter, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import { PluvServer, PluvServerConfig } from "./PluvServer";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import {
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
    ResolvedPluvIOAuthorize,
} from "./types";
import { oneLine, parsePluvSchema } from "./utils";
import { __PLUV_VERSION } from "./version";

export type PluvIOConfig<T extends IODefs = IODefs> = {
    authorize: T["authorize"];
    context?: PluvContext<T["platform"], T["context"]>;
    crdt?: T["crdt"];
    debug?: boolean;
    limits?: PluvIOLimits;
    platform: () => T["platform"];
};

type ResolvedServerConfig<T extends IODefs = IODefs> = Partial<PluvIOListeners<T>> &
    PluvIORouter<T> &
    (HasCrdtLibrary<T["crdt"]> extends true
        ? { getInitialStorage: GetInitialStorageFn<T["context"]> }
        : { getInitialStorage?: "[ERROR]: Must specify crdt to use getInitialStorage" });

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

    private readonly _authorize: T["authorize"];
    private readonly _context: PluvContext<T["platform"], T["context"]> = {} as PluvContext<
        T["platform"],
        T["context"]
    >;
    private readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any, any> };
    private readonly _debug: boolean;
    private readonly _limits: PluvIOLimits;
    private readonly _platform: () => T["platform"];

    public get procedure(): PluvProcedure<T, {}, {}> {
        return new PluvProcedure();
    }

    constructor(options: PluvIOConfig<T>) {
        const {
            authorize: authorizeConfig,
            context,
            crdt = noop,
            debug = false,
            limits,
            platform,
        } = options;

        this._authorize = authorizeConfig;
        this._crdt = crdt as CrdtLibraryType<any>;
        this._debug = debug;
        this._limits = {
            presenceMaxSize: MAX_PRESENCE_SIZE_BYTES,
            storageMaxSize: MAX_STORAGE_SIZE_BYTES,
            userIdMaxLength: MAX_USER_ID_LENGTH,
            userMaxSize: MAX_USER_SIZE_BYTES,
            ...limits,
        };
        this._platform = platform;

        if (context) this._context = context;
    }

    public async createToken(
        params: JWTEncodeParams<InferIOAuthorizeUser<T["authorize"]>, T["platform"]>,
    ): Promise<string> {
        const platform = this._platform();
        const { maxAge, room, user, ...initRest } = params;
        const initContext = platform.normalizeInitContext(
            initRest as InferInitContextType<T["platform"]>,
        );
        const authorizeParams = { ...params, ...initContext };
        const ioAuthorize = this._getIOAuthorize(authorizeParams);
        const parsed = parsePluvSchema(ioAuthorize.user, user);

        if (!!this._limits.userIdMaxLength && user.id.length > this._limits.userIdMaxLength) {
            throw new Error(oneLine`
                createToken was called with a long user id. User ID must be at
                most 128 characters. Current length: ${user.id.length.toLocaleString()}
            `);
        }

        const bytes = new TextEncoder().encode(JSON.stringify(parsed)).length;

        if (!!this._limits.userMaxSize && bytes > this._limits.userMaxSize) {
            throw new Error(oneLine`
                createToken called with large payload. User must be at most 512
                bytes. Current size: ${bytes.toLocaleString()} bytes
            `);
        }

        if (platform._createToken) {
            return await platform._createToken({ ...authorizeParams, authorize: ioAuthorize });
        }

        const secret = ioAuthorize.secret ?? null;

        if (!secret) throw new Error("`authorize` was specified without a valid secret");

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
            authorize: this._authorize,
            context: this._context,
            crdt: this._crdt,
            debug: this._debug,
            io: this,
            limits: this._limits,
            platform: this._platform,
        });
    }

    private _getIOAuthorize(
        options: WebSocketRegisterConfig<T["platform"]>,
    ): ResolvedPluvIOAuthorize<any, any> {
        if (typeof this._authorize === "function") {
            return this._authorize(options);
        }

        return this._authorize as ResolvedPluvIOAuthorize<any, any>;
    }
}

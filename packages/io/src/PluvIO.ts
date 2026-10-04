import type { HasStorage } from "@pluv/crdt";
import type {
    HasRequiredProperty,
    InferTreatyUser,
    OnGetOperator,
    OperatorUser,
    SetKey,
} from "@pluv/types";
import type { InferInitContextType } from "./AbstractPlatform";
import type { IODefs } from "./IODefs";
import { PluvProcedure } from "./PluvProcedure";
import type { MergedRouter, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import { PluvServer, PluvServerConfig } from "./PluvServer";
import type {
    CreateTokenIdentity,
    CreateTokenParams,
    CreateUserTokenParams,
    JWTEncodeParams,
} from "./authorize";
import { authorize, isOperatorToken } from "./authorize";
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
import {
    oneLine,
    parseOperatorUser,
    parsePluvSchema,
    resolveIOSecret,
    assertExhaustive,
    assertPresenceFanoutBudget,
} from "./utils";
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
    PluvIORouter<T> & {
        onGetOperator?: OnGetOperator<InferTreatyUser<T["treaty"]>>;
    } & (HasStorage<T["treaty"]["storage"]> extends true
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

type ResolveEncodeParams<T extends IODefs = IODefs> = {
    initContext: InferInitContextType<T["platform"]>;
    onGetOperator: OnGetOperator<InferTreatyUser<T["treaty"]>> | null;
    token: CreateTokenIdentity<InferTreatyUser<T["treaty"]>>;
};

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
        params: CreateUserTokenParams<InferTreatyUser<T["treaty"]>, T["platform"]>,
    ): Promise<string>;
    public async createToken(
        params: CreateTokenParams<InferTreatyUser<T["treaty"]>, T["platform"]>,
        options: { onGetOperator?: OnGetOperator<InferTreatyUser<T["treaty"]>> | null },
    ): Promise<string>;
    public async createToken(
        params: CreateTokenParams<InferTreatyUser<T["treaty"]>, T["platform"]>,
        options?: { onGetOperator?: OnGetOperator<InferTreatyUser<T["treaty"]>> | null },
    ): Promise<string> {
        const platform = this._platform();
        const token = params as {
            kind?: "user" | "operator";
            maxAge?: number;
            operator?: unknown;
            room: string;
            user?: unknown;
        };
        const { maxAge, room, ...rest } = token;
        const initRest = isOperatorToken(token)
            ? (() => {
                  const { operator: _operator, kind: _kind, ...init } = rest;
                  return init;
              })()
            : (() => {
                  const { user: _user, kind: _kind, ...init } = rest;
                  return init;
              })();
        const initContext = platform.normalizeInitContext(
            initRest as InferInitContextType<T["platform"]>,
        );

        const encodeParams = await this._resolveEncodeParams({
            initContext,
            onGetOperator: options?.onGetOperator ?? null,
            token: params,
        });
        const secret = resolveIOSecret(this._secret, encodeParams);
        const ioAuthorize = { user: this._treaty.user, secret };

        if (platform._createToken) {
            return await platform._createToken({ ...encodeParams, authorize: ioAuthorize });
        }

        if (!secret) throw new Error("`secret` was not provided");

        return await authorize({ platform, secret }).encode(
            encodeParams as JWTEncodeParams<any, T["platform"]>,
        );
    }

    private async _resolveEncodeParams(
        params: ResolveEncodeParams<T>,
    ): Promise<JWTEncodeParams<InferTreatyUser<T["treaty"]>, T["platform"]>> {
        const { initContext, onGetOperator, token } = params;
        switch (token.kind) {
            case "operator": {
                if (!onGetOperator) {
                    throw new Error(
                        "`onGetOperator` must be set on `io.server()`; mint operator tokens with `ioServer.createToken`",
                    );
                }

                const operator = parseOperatorUser(token.operator);

                if (typeof token.operator.email !== "string" || token.operator.email.length === 0) {
                    throw new Error("Invalid operator email");
                }

                this._assertIdLength(operator.id, "operator");

                const derived = await onGetOperator({
                    operator: { ...operator, email: token.operator.email },
                    room: token.room,
                });

                if (!derived) {
                    throw new Error("`onGetOperator` returned null");
                }

                const parsed = parsePluvSchema(this._treaty.user, derived) as InferTreatyUser<
                    T["treaty"]
                >;

                this._assertUserLimits({ operator, user: parsed });

                return {
                    ...token,
                    ...initContext,
                    kind: "operator",
                    operator,
                    user: parsed,
                };
            }
            case "user":
            case undefined: {
                const parsed = parsePluvSchema(this._treaty.user, token.user) as InferTreatyUser<
                    T["treaty"]
                >;

                this._assertUserLimits({ user: parsed });

                return {
                    ...token,
                    ...initContext,
                    kind: "user",
                    user: parsed,
                };
            }
            default:
                return assertExhaustive(token);
        }
    }

    private _assertIdLength(id: string, label: "user" | "operator"): void {
        if (!this._limits.userIdMaxLength || id.length <= this._limits.userIdMaxLength) return;

        throw new Error(oneLine`
            createToken was called with a long ${label} id. ID must be at
            most ${this._limits.userIdMaxLength.toLocaleString()} characters.
            Current length: ${id.length.toLocaleString()}
        `);
    }

    private _assertUserLimits(params: {
        operator?: OperatorUser | null;
        user: InferTreatyUser<T["treaty"]>;
    }): void {
        const { operator, user } = params;
        this._assertIdLength(user.id, "user");

        const userBytes = new TextEncoder().encode(JSON.stringify(user)).length;
        const operatorBytes = operator
            ? new TextEncoder().encode(JSON.stringify(operator)).length
            : 0;
        const bytes = userBytes + operatorBytes;

        if (!this._limits.userMaxSize || bytes <= this._limits.userMaxSize) return;

        const subject = operator ? "User and operator together must" : "User must";

        throw new Error(oneLine`
            createToken called with large payload. ${subject} be at most
            ${this._limits.userMaxSize.toLocaleString()} bytes. Current size:
            ${bytes.toLocaleString()} bytes
        `);
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

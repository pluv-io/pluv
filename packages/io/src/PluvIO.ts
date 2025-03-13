import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import { noop } from "@pluv/crdt";
import type { IOAuthorize, InferIOAuthorizeUser } from "@pluv/types";
import type { AbstractPlatform, InferInitContextType } from "./AbstractPlatform";
import { WebsocketRegisterConfig } from "./IORoom";
import { PluvProcedure } from "./PluvProcedure";
import type { MergedRouter, PluvRouterEventConfig } from "./PluvRouter";
import { PluvRouter } from "./PluvRouter";
import { PluvServer, PluvServerConfig } from "./PluvServer";
import type { JWTEncodeParams } from "./authorize";
import { authorize } from "./authorize";
import type {
    CrdtLibraryType,
    GetInitialStorageFn,
    PluvContext,
    PluvIOAuthorize,
    PluvIOListeners,
    PluvIORouter,
    ResolvedPluvIOAuthorize,
} from "./types";
import { __PLUV_VERSION } from "./version";

export type PluvIOConfig<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, InferInitContextType<TPlatform>> | null,
    TContext extends Record<string, any>,
> = {
    authorize?: TAuthorize;
    context?: PluvContext<TPlatform, TContext>;
    crdt?: CrdtLibraryType;
    debug?: boolean;
    platform: TPlatform;
};

type ResolvedServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = Partial<PluvIOListeners<TPlatform, TAuthorize, TContext, TEvents>> &
    PluvIORouter<TPlatform, TAuthorize, TContext, TEvents> & {
        getInitialStorage?: GetInitialStorageFn<TContext>;
    };

export type ServerConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> = {
    [P in keyof ResolvedServerConfig<TPlatform, TAuthorize, TContext, TEvents> as ResolvedServerConfig<
        TPlatform,
        TAuthorize,
        TContext,
        TEvents
    >[P] extends undefined
        ? never
        : P]: ResolvedServerConfig<TPlatform, TAuthorize, TContext, TEvents>[P];
};

export class PluvIO<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends PluvIOAuthorize<TPlatform, any, InferInitContextType<TPlatform>> | null = any,
    TContext extends Record<string, any> = {},
> {
    public readonly version: string = __PLUV_VERSION as any;

    private readonly _authorize: TAuthorize = null as TAuthorize;
    private readonly _context: PluvContext<TPlatform, TContext> = {} as PluvContext<TPlatform, TContext>;
    private readonly _crdt: { doc: (value: any) => AbstractCrdtDocFactory<any> };
    private readonly _debug: boolean;
    private readonly _platform: TPlatform;

    public get procedure(): PluvProcedure<TPlatform, TAuthorize, TContext, {}, {}> {
        return new PluvProcedure();
    }

    constructor(options: PluvIOConfig<TPlatform, TAuthorize, TContext>) {
        const { authorize, context, crdt = noop, debug = false, platform } = options;

        this._crdt = crdt;
        this._debug = debug;
        this._platform = platform;

        if (authorize) this._authorize = authorize;
        if (context) this._context = context;
    }

    public async createToken(params: JWTEncodeParams<InferIOAuthorizeUser<TAuthorize>, TPlatform>): Promise<string> {
        if (!this._authorize) throw new Error("IO does not specify authorize during initialization.");

        const ioAuthorize = this._getIOAuthorize(params);
        const secret = ioAuthorize?.secret ?? null;

        if (!secret) throw new Error("`authorize` was specified without a valid secret");

        return await authorize({ platform: this._platform, secret }).encode(params as JWTEncodeParams<any, TPlatform>);
    }

    public mergeRouters<TRouters extends PluvRouter<TPlatform, TAuthorize, TContext, any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        return PluvRouter.merge(...routers);
    }

    public router<TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>>(
        events: TEvents,
    ): PluvRouter<TPlatform, TAuthorize, TContext, TEvents> {
        const invalidName = Object.keys(events).find((name) => name.includes("$"));

        if (typeof invalidName === "string") {
            throw new Error(`Invalid event name. Event names must not contain $: "${invalidName}"`);
        }

        return new PluvRouter<TPlatform, TAuthorize, TContext, TEvents>(events);
    }

    public server<TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext>>(
        config: ServerConfig<TPlatform, TAuthorize, TContext, TEvents> = {} as ServerConfig<
            TPlatform,
            TAuthorize,
            TContext,
            TEvents
        >,
    ): PluvServer<TPlatform, TAuthorize, TContext, TEvents> {
        return new PluvServer<TPlatform, TAuthorize, TContext, TEvents>({
            ...config,
            authorize: this._authorize ?? undefined,
            context: this._context,
            crdt: this._crdt,
            debug: this._debug,
            platform: this._platform,
        } as PluvServerConfig<TPlatform, TAuthorize, TContext, TEvents>);
    }

    private _getIOAuthorize(options: WebsocketRegisterConfig<TPlatform>): ResolvedPluvIOAuthorize<any, any> | null {
        if (typeof this._authorize === "function") {
            return this._authorize(options);
        }

        return this._authorize as ResolvedPluvIOAuthorize<any, any> | null;
    }
}

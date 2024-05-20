import type { BaseIOAuthorize, IOAuthorize, IORouterLike, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferPlatformRoomContextType } from "./AbstractPlatform";
import type { PluvProcedure } from "./PluvProcedure";

export type PluvRouterEventConfig<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
> = {
    [P: string]: Pick<PluvProcedure<TPlatform, TAuthorize, TContext, any, any>, "config">;
};

export type MergedRouter<
    TRouters extends PluvRouter<TPlatform, TAuthorize, TContext, any>[] = [],
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TRoot extends TRouters[0]["_events"] = {},
> = TRouters extends [
    infer IHead extends PluvRouter<TPlatform, TAuthorize, TContext, any>,
    ...infer ITail extends PluvRouter<TPlatform, TAuthorize, TContext, any>[],
]
    ? MergedRouter<ITail, TPlatform, TAuthorize, TContext, TRoot & IHead["_events"]>
    : PluvRouter<TPlatform, TAuthorize, TContext, TRoot>;

export class PluvRouter<
    TPlatform extends AbstractPlatform<any> = AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>> = BaseIOAuthorize,
    TContext extends JsonObject = {},
    TEvents extends PluvRouterEventConfig<TPlatform, TAuthorize, TContext> = {},
> implements IORouterLike<TEvents>
{
    readonly _events: TEvents = {} as TEvents;

    constructor(events: TEvents) {
        this._events = events;
    }

    public static merge<TRouters extends PluvRouter<any, any, any, any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        const events = Object.assign(Object.create(null), ...routers.map((router) => router._events));

        return new PluvRouter<any, any, any, any>(events) as MergedRouter<TRouters>;
    }
}

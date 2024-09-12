import type { CrdtType } from "@pluv/crdt";
import type { IOLike, IORouterLike, JsonObject, ProcedureLike } from "@pluv/types";
import type { PluvProcedure } from "./PluvProcedure";

export type PluvRouterEventConfig<
    TIO extends IOLike = IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> = { [P: string]: Pick<PluvProcedure<TIO, any, any, TPresence, TStorage>, "config"> };

export type MergedRouter<
    TRouters extends PluvRouter<TIO, TPresence, TStorage, any>[] = [],
    TIO extends IOLike = IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TRoot extends TRouters[0]["_defs"]["events"] = {},
> = TRouters extends [
    infer IHead extends PluvRouter<TIO, TPresence, TStorage, any>,
    ...infer ITail extends PluvRouter<TIO, TPresence, TStorage, any>[],
]
    ? MergedRouter<ITail, TIO, TPresence, TStorage, TRoot & IHead["_defs"]["events"]>
    : PluvRouter<TIO, TPresence, TStorage, TRoot>;

export type MergeEvents<
    TClientEvents extends PluvRouterEventConfig<any, any, any>,
    TServerIO extends IOLike<any, any>,
> =
    TServerIO extends IOLike<infer IAuthorize, infer IServerEvents>
        ? IOLike<
              IAuthorize,
              {
                  [P in keyof TClientEvents]: TClientEvents[P] extends ProcedureLike<any, infer IClientOutput>
                      ? keyof IClientOutput extends keyof IServerEvents
                          ? IServerEvents[keyof IClientOutput]
                          : TClientEvents[P]
                      : never;
              } & IServerEvents
          >
        : never;

export class PluvRouter<
    TIO extends IOLike = IOLike,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TStorage> = {},
> implements IORouterLike<TEvents>
{
    readonly _defs: { events: TEvents } = { events: {} as TEvents };

    constructor(events: TEvents) {
        this._defs = { events };
    }

    public static merge<TRouters extends PluvRouter<any, any, any, any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        const events = Object.assign(Object.create(null), ...routers.map((router) => router._defs.events));

        if (Object.keys(events).some((key) => key.startsWith("$"))) {
            throw new Error('Procedures may not start with "$"');
        }

        return new PluvRouter<any, any, any, any>(events) as MergedRouter<TRouters>;
    }
}

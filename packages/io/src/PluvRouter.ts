import type { IORouterLike, SetKey } from "@pluv/types";
import type { IODefs } from "./IODefs";
import type { PluvProcedure } from "./PluvProcedure";
import { assertEventNames, createInternalPluvRouter } from "./utils";

export type PluvRouterEventConfig<T extends IODefs = IODefs> = {
    [P: string]: Pick<PluvProcedure<T, any, any>, "config">;
};

export type MergedRouter<
    TRouters extends PluvRouter<any>[] = [],
    T extends IODefs = IODefs,
    TRoot extends Record<string, any> = {},
> = TRouters extends [infer IHead extends PluvRouter<any>, ...infer ITail extends PluvRouter<any>[]]
    ? MergedRouter<ITail, T, TRoot & IHead["_defs"]["events"]>
    : PluvRouter<SetKey<T, "events", TRoot>>;

export class PluvRouter<T extends IODefs = IODefs> implements IORouterLike<T["events"]> {
    readonly _defs: { events: T["events"] } = { events: {} as T["events"] };

    constructor(events: T["events"]) {
        assertEventNames(Object.keys(events as Record<string, unknown>), { allowDollar: false });
        this._defs = { events };
    }

    public static merge<TRouters extends PluvRouter<any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        const seen = new Set<string>();

        for (const router of routers) {
            for (const name of Object.keys(router._defs.events as Record<string, unknown>)) {
                if (seen.has(name)) {
                    throw new Error(`Duplicate event name "${name}" when merging routers`);
                }

                seen.add(name);
            }
        }

        const events = Object.assign(
            Object.create(null),
            ...routers.map((router) => router._defs.events),
        );

        return createInternalPluvRouter(events) as MergedRouter<TRouters>;
    }
}

import type { IORouterLike, SetKey } from "@pluv/types";
import type { IODefs } from "./IODefs";
import type { PluvProcedure } from "./PluvProcedure";

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
        const invalidName = Object.keys(events).find((name) => !this._isValidEventName(name));

        if (typeof invalidName === "string") {
            throw new Error(
                `Invalid event name. Event names must be formatted as valid JavaScript variable names: "${invalidName}"`,
            );
        }

        this._defs = { events };
    }

    public static merge<TRouters extends PluvRouter<any>[]>(
        ...routers: TRouters
    ): MergedRouter<TRouters> {
        const events = Object.assign(
            Object.create(null),
            ...routers.map((router) => router._defs.events),
        );

        return new PluvRouter<any>(events) as MergedRouter<TRouters>;
    }

    private _isValidEventName(name: string): boolean {
        return /^[a-z_$][a-z0-9_$]*$/gi.test(name);
    }
}

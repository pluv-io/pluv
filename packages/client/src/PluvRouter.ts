import type { IORouterLike, SetKey } from "@pluv/types";
import type { ClientDefs } from "./ClientDefs";
import type { PluvProcedure } from "./PluvProcedure";

export type PluvRouterEventConfig<TDefs extends ClientDefs = ClientDefs> = {
    [P: string]: Pick<PluvProcedure<TDefs, any, any>, "config">;
};

export type MergedRouter<
    TRouters extends PluvRouter<any>[] = [],
    TDefs extends ClientDefs = ClientDefs,
    TRoot extends Record<string, any> = {},
> = TRouters extends [infer IHead extends PluvRouter<any>, ...infer ITail extends PluvRouter<any>[]]
    ? MergedRouter<ITail, TDefs, TRoot & IHead["_defs"]["events"]>
    : PluvRouter<SetKey<TDefs, "events", TRoot>>;

export class PluvRouter<TDefs extends ClientDefs = ClientDefs> implements IORouterLike<
    TDefs["events"]
> {
    readonly _defs: { events: TDefs["events"] } = { events: {} as TDefs["events"] };

    constructor(events: TDefs["events"]) {
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

        if (Object.keys(events).some((key) => key.startsWith("$"))) {
            throw new Error('Procedures may not start with "$"');
        }

        return new PluvRouter<any>(events) as MergedRouter<TRouters>;
    }

    private _isValidEventName(name: string): boolean {
        return /^[a-z_$][a-z0-9_$]*$/gi.test(name);
    }
}

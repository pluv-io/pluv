import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { IOLike, IORouterLike, JsonObject } from "@pluv/types";
import type { PluvProcedure } from "./PluvProcedure";

export type PluvRouterEventConfig<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
> = { [P: string]: Pick<PluvProcedure<TIO, any, any, TPresence, TCrdt, "">, "config"> };

export type MergedRouter<
    TRouters extends PluvRouter<TIO, TPresence, TCrdt, any>[],
    TIO extends IOLike,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TRoot extends TRouters[0]["_defs"]["events"],
> = TRouters extends [
    infer IHead extends PluvRouter<TIO, TPresence, TCrdt, any>,
    ...infer ITail extends PluvRouter<TIO, TPresence, TCrdt, any>[],
]
    ? MergedRouter<ITail, TIO, TPresence, TCrdt, TRoot & IHead["_defs"]["events"]>
    : PluvRouter<TIO, TPresence, TCrdt, TRoot>;

export class PluvRouter<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TCrdt extends AbstractCrdtDocFactory<any, any>,
    TEvents extends PluvRouterEventConfig<TIO, TPresence, TCrdt> = {},
> implements IORouterLike<TEvents>
{
    readonly _defs: { events: TEvents } = { events: {} as TEvents };

    constructor(events: TEvents) {
        const invalidName = Object.keys(events).find((name) => !this._isValidEventName(name));

        if (typeof invalidName === "string") {
            throw new Error(
                `Invalid event name. Event names must be formatted as valid JavaScript variable names: "${invalidName}"`,
            );
        }

        this._defs = { events };
    }

    public static merge<
        TRouters extends PluvRouter<TIO, TPresence, TCrdt, any>[],
        TIO extends IOLike,
        TPresence extends JsonObject,
        TCrdt extends AbstractCrdtDocFactory<any, any>,
    >(...routers: TRouters): MergedRouter<TRouters, TIO, TPresence, TCrdt, {}> {
        const events = Object.assign(
            Object.create(null),
            ...routers.map((router) => router._defs.events),
        );

        if (Object.keys(events).some((key) => key.startsWith("$"))) {
            throw new Error('Procedures may not start with "$"');
        }

        return new PluvRouter<any, any, any, any>(events) as MergedRouter<
            TRouters,
            TIO,
            TPresence,
            TCrdt,
            {}
        >;
    }

    private _isValidEventName(name: string): boolean {
        return /^[a-z_$][a-z0-9_$]*$/gi.test(name);
    }
}

import type { IODefs } from "../IODefs";
import { PluvRouter } from "../PluvRouter";
import { assertEventNames } from "./eventNames";

/**
 * Build a router that may include `$` protocol events. Not part of the public
 * package API — import via `__internal` or sibling modules under `@pluv/io`.
 */
export const createInternalPluvRouter = <T extends IODefs = IODefs>(
    events: T["events"],
): PluvRouter<T> => {
    assertEventNames(Object.keys(events as Record<string, unknown>), { allowDollar: true });

    const router = Object.create(PluvRouter.prototype) as PluvRouter<T>;
    (router as { _defs: PluvRouter<T>["_defs"] })._defs = { events };

    return router;
};

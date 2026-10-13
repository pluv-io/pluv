import type { IODefs, SetKey } from "./IODefs";
import { PluvRouter } from "./PluvRouter";
import { createSessionRouter } from "./createSessionRouter";
import { createStorageRouter } from "./createStorageRouter";
import type { IOStorageUpdatedEvent, PluvIOLimits } from "./types";

export type CreateBaseRouterParams<T extends IODefs = IODefs> = {
    limits: Pick<PluvIOLimits, "presenceMaxSize" | "storageMaxSize">;
    logDebug?: (...data: any[]) => void;
    onStorageUpdated: (event: IOStorageUpdatedEvent<T>) => void;
};

type BaseRouter<T extends IODefs> = PluvRouter<SetKey<T, "events", {}>>;

/**
 * Built-in `$` protocol events. Kept separate from `PluvServer` so the protocol
 * can be constructed/tested without a full server instance. A flat room merges
 * the session slice and the storage slice.
 */
export const createBaseRouter = <T extends IODefs = IODefs>(
    params: CreateBaseRouterParams<T>,
): BaseRouter<T> => {
    return PluvRouter.merge(
        createSessionRouter(params),
        createStorageRouter(params),
    ) as BaseRouter<T>;
};

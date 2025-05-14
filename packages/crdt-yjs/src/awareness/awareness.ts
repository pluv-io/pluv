import type { CrdtType, IOLike, JsonObject, PluvRouterEventConfig } from "@pluv/types";
import type { PluvYjsAwarenessParams } from "./PluvYjsAwareness";
import { PluvYjsAwareness } from "./PluvYjsAwareness";

export const awareness = <
    TIO extends IOLike<any>,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
>(
    params: PluvYjsAwarenessParams<TIO, TPresence, TStorage, TEvents>,
): PluvYjsAwareness<TIO, TPresence, TStorage, TEvents> => {
    return new PluvYjsAwareness(params);
};

import type { CrdtType, IOLike, PluvRouterEventConfig } from "@pluv/types";
import type { PluvYjsAwarenessParams } from "./PluvYjsAwareness";
import { PluvYjsAwareness } from "./PluvYjsAwareness";

export const awareness = <
    TIO extends IOLike<any, any, any>,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
>(
    params: PluvYjsAwarenessParams<TIO, TPresence, TStorage, TEvents, TField>,
): PluvYjsAwareness<TIO, TPresence, TStorage, TEvents, TField> => {
    return new PluvYjsAwareness(params);
};

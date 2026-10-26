import type { IOLike } from "@pluv/types";
import type { PluvYjsAwarenessParams } from "./PluvYjsAwareness";
import { PluvYjsAwareness } from "./PluvYjsAwareness";

export const awareness = <
    TIO extends IOLike,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, any>,
    TField extends keyof TPresence | null = null,
>(
    params: PluvYjsAwarenessParams<TIO, TPresence, TStorage, TField>,
): PluvYjsAwareness<TIO, TPresence, TStorage, TField> => {
    return new PluvYjsAwareness(params);
};

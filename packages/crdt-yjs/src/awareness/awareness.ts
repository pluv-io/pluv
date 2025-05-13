import type { PluvYjsAwarenessParams } from "./PluvYjsAwareness";
import { PluvYjsAwareness } from "./PluvYjsAwareness";

export const awareness = (params: PluvYjsAwarenessParams): PluvYjsAwareness => {
    return new PluvYjsAwareness(params);
};

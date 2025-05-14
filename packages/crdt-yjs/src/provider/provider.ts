import type { CrdtType, IOLike, JsonObject, PluvRouterEventConfig } from "@pluv/types";
import type { PluvYjsProviderParams } from "./PluvYjsProvider";
import { PluvYjsProvider } from "./PluvYjsProvider";

export const provider = <
    TIO extends IOLike,
    TPresence extends JsonObject,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
>(
    params: PluvYjsProviderParams<TIO, TPresence, TStorage, TEvents>,
) => {
    return new PluvYjsProvider(params);
};

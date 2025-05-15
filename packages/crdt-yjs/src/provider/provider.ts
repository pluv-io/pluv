import type { CrdtType, IOLike, PluvRouterEventConfig } from "@pluv/types";
import type { PluvYjsProviderParams } from "./PluvYjsProvider";
import { PluvYjsProvider } from "./PluvYjsProvider";

export const provider = <
    TIO extends IOLike<any>,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, CrdtType<any, any>>,
    TEvents extends PluvRouterEventConfig,
    TField extends keyof TPresence | null = null,
>(
    params: PluvYjsProviderParams<TIO, TPresence, TStorage, TEvents, TField>,
) => {
    return new PluvYjsProvider(params);
};

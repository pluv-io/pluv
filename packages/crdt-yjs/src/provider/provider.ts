import type { IOLike } from "@pluv/types";
import type { PluvYjsProviderParams } from "./PluvYjsProvider";
import { PluvYjsProvider } from "./PluvYjsProvider";

export const provider = <
    TIO extends IOLike,
    TPresence extends Record<string, any>,
    TStorage extends Record<string, any>,
    TField extends keyof TPresence | null = null,
>(
    params: PluvYjsProviderParams<TIO, TPresence, TStorage, TField>,
) => {
    return new PluvYjsProvider(params);
};

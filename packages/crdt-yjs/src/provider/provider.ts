import type { PluvYjsProviderParams } from "./PluvYjsProvider";
import { PluvYjsProvider } from "./PluvYjsProvider";

export const provider = (params: PluvYjsProviderParams) => {
    return new PluvYjsProvider(params);
};

import type { CrdtType } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import type { PluvClientOptions } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <
    TIO extends IOLike<any, any>,
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TMetadata extends JsonObject = {},
>(
    options: PluvClientOptions<TIO, TPresence, TStorage, TMetadata>,
): PluvClient<TIO, TPresence, TStorage, TMetadata> => {
    return new PluvClient<TIO, TPresence, TStorage, TMetadata>(options);
};

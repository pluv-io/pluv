import type { AbstractCrdtDocFactory, NoopCrdtDocFactory } from "@pluv/crdt";
import type { IOLike, JsonObject } from "@pluv/types";
import type { PluvClientOptions } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <
    TIO extends IOLike<any, any, any>,
    TPresence extends Record<string, any> = {},
    TCrdt extends AbstractCrdtDocFactory<any, any> = NoopCrdtDocFactory,
    TMetadata extends JsonObject = {},
>(
    options: PluvClientOptions<TIO, TPresence, TCrdt, TMetadata>,
): PluvClient<TIO, TPresence, TCrdt, TMetadata> => {
    return new PluvClient<TIO, TPresence, TCrdt, TMetadata>(options);
};

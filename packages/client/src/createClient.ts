import type { IOLike, JsonObject } from "@pluv/types";
import type { PluvClientOptions } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <TIO extends IOLike = IOLike, TMetadata extends JsonObject = {}>(
    options: PluvClientOptions<TIO, TMetadata>,
): PluvClient<TIO, TMetadata> => {
    return new PluvClient<TIO, TMetadata>(options);
};

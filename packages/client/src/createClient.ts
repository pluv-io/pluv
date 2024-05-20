import type { IOLike } from "@pluv/types";
import type { PluvClientOptions } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <TIO extends IOLike = IOLike>(options: PluvClientOptions<TIO>): PluvClient<TIO> => {
    return new PluvClient<TIO>(options);
};

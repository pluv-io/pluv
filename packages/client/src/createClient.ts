import type { IOLike } from "@pluv/types";
import type { CreateClientBuilder } from "./PluvClient";
import { PluvClient } from "./PluvClient";

export const createClient = <TIO extends IOLike = any>(): CreateClientBuilder<TIO> => ({
    config: ((options) => new PluvClient(options as any)) as CreateClientBuilder<TIO>["config"],
});

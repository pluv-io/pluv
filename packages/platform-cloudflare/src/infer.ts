import type { Json } from "@pluv/types";
import type { identity } from "./utils";

export type InferCallback<
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
> = (i: typeof identity) => {
    env?: (io: TEnv) => TEnv;
    meta?: (io: TMeta) => TMeta;
};

export const infer = <
    TEnv extends Record<string, any> = {},
    TMeta extends Record<string, Json> = {},
>(
    callback: InferCallback<TEnv, TMeta>,
) => callback;

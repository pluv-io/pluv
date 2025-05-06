import type { Json } from "@pluv/types";
import type { identity } from "./utils";

export type InferCallback<TMeta extends Record<string, Json> = {}> = (i: typeof identity) => {
    meta?: (io: TMeta) => TMeta;
};

export const infer = <TMeta extends Record<string, Json> = {}>(callback: InferCallback<TMeta>) =>
    callback;

import type { IOLike } from "@pluv/types";
import type { identity } from "./utils";

export type InferCallback<TIO extends IOLike<any, any>> = (i: typeof identity) => {
    io: (io: TIO) => TIO;
};

export const infer = <TIO extends IOLike<any, any>>(callback: InferCallback<TIO>): InferCallback<TIO> => callback;

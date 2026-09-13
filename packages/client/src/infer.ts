import type { IOLike } from "@pluv/types";
import type { identity } from "./utils";

export type InferIOLike<TIO extends IOLike> = IOLike<
    Pick<TIO["_defs"], "authorize" | "crdt" | "events">
>;

export type InferCallback<TIO extends IOLike> = (i: typeof identity) => {
    io: (io: TIO) => TIO;
};

export const infer = <TIO extends IOLike>(
    callback: InferCallback<TIO>,
): InferCallback<InferIOLike<TIO>> => {
    return callback as any;
};

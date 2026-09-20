import type { IOLike } from "@pluv/types";

export type InferIOLike<TIO extends IOLike> = IOLike<Pick<TIO["_defs"], "treaty" | "events">>;

import type { InferIOAuthorize, InferIOCrdt, InferIOEvents, IOLike } from "@pluv/types";
import type { identity } from "./utils";

export type InferCallback<TIO extends IOLike<any, any, any>> = (i: typeof identity) => {
    io: (io: TIO) => TIO;
};

export const infer = <TIO extends IOLike<any, any, any>>(
    callback: InferCallback<TIO>,
): InferCallback<IOLike<InferIOAuthorize<TIO>, InferIOCrdt<TIO>, InferIOEvents<TIO>>> => {
    return callback as any;
};

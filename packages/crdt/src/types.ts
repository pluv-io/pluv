import type { Json } from "@pluv/types";
import type { AbstractCrdtType } from "./AbstractCrdtType";

export type InferCrdtStorageJson<T extends unknown> =
    T extends AbstractCrdtType<any, infer ICrdtJson>
        ? InferCrdtStorageJson<ICrdtJson>
        : T extends Record<string, any>
          ? { [P in keyof T]: InferCrdtStorageJson<T[P]> }
          : T extends (infer IArrayCrdtItem)[]
            ? InferCrdtStorageJson<IArrayCrdtItem>[]
            : T extends readonly (infer IReadonlyArrayCrdtItem)[]
              ? InferCrdtStorageJson<IReadonlyArrayCrdtItem>
              : T extends Json
                ? T
                : string;

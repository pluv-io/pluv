import type { Json } from "@pluv/types";

export type CrdtType<TValue extends unknown, TJson extends unknown = any> = TValue & {
    __def?: () => TJson;
};

export type InferCrdtJson<T extends any> =
    T extends Record<string, any>
        ? { [P in keyof T]: InferCrdtJson<T[P]> }
        : T extends (infer IJson)[]
          ? InferCrdtJson<IJson>[]
          : T extends readonly (infer IJson)[]
            ? readonly InferCrdtJson<IJson>[]
            : T extends Json
              ? T
              : string;

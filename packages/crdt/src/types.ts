import type { Json } from "@pluv/types";

export type CrdtType<TValue extends unknown, TJson extends unknown = any> = Omit<TValue, "__pluvType"> & {
    __pluvType: () => TJson;
};

export type InferCrdtJson<T extends unknown> =
    T extends CrdtType<any, infer IJson>
        ? InferCrdtJson<IJson>
        : T extends Record<string, any>
          ? { [P in keyof T]: InferCrdtJson<T[P]> }
          : T extends (infer IJson)[]
            ? InferCrdtJson<IJson>[]
            : T extends readonly (infer IJson)[]
              ? readonly InferCrdtJson<IJson>[]
              : T extends Json
                ? T
                : string;

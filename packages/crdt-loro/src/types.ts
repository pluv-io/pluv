import type { Json } from "@pluv/types";
import type { LoroList, LoroMap, LoroText } from "loro-crdt";
import type { CrdtLoroArray } from "./array";
import type { CrdtLoroMap } from "./map";
import type { CrdtLoroObject } from "./object";
import type { CrdtLoroText } from "./text";

export type InferLoroType<T extends unknown> =
    T extends CrdtLoroArray<infer IType>
        ? LoroList<IType[]>
        : T extends CrdtLoroMap<infer IType>
          ? LoroMap<Record<string, IType>>
          : T extends CrdtLoroObject<infer IType>
            ? LoroMap<IType>
            : T extends CrdtLoroText
              ? LoroText
              : T extends Json
                ? T
                : never;

export type InferLoroJson<T extends unknown> =
    T extends CrdtLoroArray<infer IType>
        ? InferLoroJson<IType>[]
        : T extends CrdtLoroMap<infer IType>
          ? Record<string, InferLoroJson<IType>>
          : T extends CrdtLoroObject<infer IType>
            ? { [P in keyof IType]: InferLoroJson<IType[P]> }
            : T extends CrdtLoroText | LoroText
              ? string
              : T extends LoroList<infer IType>
                ? InferLoroJson<IType>
                : T extends LoroMap<infer IType>
                  ? { [P in keyof IType]: InferLoroJson<IType[P]> }
                  : T extends (infer IType)[]
                    ? InferLoroJson<IType>[]
                    : T extends Record<any, any>
                      ? { [P in keyof T]: InferLoroJson<T[P]> }
                      : T extends Json
                        ? T
                        : never;

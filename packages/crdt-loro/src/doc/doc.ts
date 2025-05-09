import type { LoroType } from "../types";
import type { LoroBuilder } from "./builder";
import { CrdtLoroDocFactory } from "./CrdtLoroDocFactory";

export const doc = <TStorage extends Record<string, LoroType<any, any>>>(
    value: (builder: LoroBuilder) => TStorage = () => ({}) as TStorage,
): CrdtLoroDocFactory<TStorage> => {
    return new CrdtLoroDocFactory<TStorage>(value);
};

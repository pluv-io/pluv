import type { LoroType } from "../types";
import { CrdtLoroDocFactory } from "./CrdtLoroDocFactory";

export const doc = <TStorage extends Record<string, LoroType<any, any>>>(
    value: () => TStorage = () => ({}) as TStorage,
): CrdtLoroDocFactory<TStorage> => {
    return new CrdtLoroDocFactory<TStorage>(value);
};

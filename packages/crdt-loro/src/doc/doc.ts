import type { AbstractCrdtType } from "@pluv/crdt";
import { CrdtLoroDocFactory } from "./CrdtLoroDocFactory";

export const doc = <
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
>(
    value: () => TStorage = () => ({}) as TStorage,
): CrdtLoroDocFactory<TStorage> => {
    return new CrdtLoroDocFactory<TStorage>(value);
};

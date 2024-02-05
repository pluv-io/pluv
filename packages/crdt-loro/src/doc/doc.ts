import { AbstractCrdtType } from "@pluv/crdt";
import { CrdtLoroDoc } from "./CrdtLoroDoc";

export const doc = <TStorage extends Record<string, AbstractCrdtType<any>>>(
    value: TStorage = {} as TStorage,
): CrdtLoroDoc<TStorage> => {
    return new CrdtLoroDoc<TStorage>(value);
};

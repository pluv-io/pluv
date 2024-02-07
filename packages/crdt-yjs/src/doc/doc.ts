import type { AbstractCrdtType } from "@pluv/crdt";
import { CrdtYjsDoc } from "./CrdtYjsDoc";

export const doc = <
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
>(
    value: TStorage = {} as TStorage,
): CrdtYjsDoc<TStorage> => {
    return new CrdtYjsDoc<TStorage>(value);
};

import type { AbstractCrdtType } from "@pluv/crdt";
import { CrdtYjsDocFactory } from "./CrdtYjsDocFactory";

export const doc = <
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
>(
    value: () => TStorage = () => ({}) as TStorage,
): CrdtYjsDocFactory<TStorage> => {
    return new CrdtYjsDocFactory<TStorage>(value);
};

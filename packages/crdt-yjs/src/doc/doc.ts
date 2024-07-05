import type { YjsType } from "../types";
import { CrdtYjsDocFactory } from "./CrdtYjsDocFactory";

export const doc = <TStorage extends Record<string, YjsType<any, any>>>(
    value: () => TStorage = () => ({}) as TStorage,
): CrdtYjsDocFactory<TStorage> => {
    return new CrdtYjsDocFactory<TStorage>(value);
};

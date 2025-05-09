import type { YjsType } from "../types";
import type { YjsBuilder } from "./builder";
import { CrdtYjsDocFactory } from "./CrdtYjsDocFactory";

export const doc = <TStorage extends Record<string, YjsType<any, any>>>(
    value: (buidler: YjsBuilder) => TStorage = () => ({}) as TStorage,
): CrdtYjsDocFactory<TStorage> => {
    return new CrdtYjsDocFactory<TStorage>(value);
};

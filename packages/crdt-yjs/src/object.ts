import { Map as YMap } from "yjs";
import type { YjsType } from "./types";

export const object = <T extends Record<string, any>>(value: T): YjsType<YMap<T[keyof T]>, T> => {
    return new YMap(Object.entries(value)) as YjsType<YMap<T[keyof T]>, T>;
};

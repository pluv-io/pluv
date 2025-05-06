import type { Map as YMap } from "yjs";
import type { YjsType } from "../types";
import { YjsObject } from "./YjsObject";

export const object = <T extends Record<string, any>>(
    value: T = {} as T,
): YjsType<YMap<T[keyof T]>, T> => {
    return new YjsObject<T>(value);
};

import type { Map as YMap } from "yjs";
import type { YjsType } from "../types";
import { YjsObject } from "./YjsObject";

/**
 * @deprecated This will be removed in v2.0.0. Use yjs.map instead
 * @description Creates a Yjs map, but declare it like it's an object
 * @date May 8, 2025
 */
export const object = <T extends Record<string, any>>(
    value: T = {} as T,
): YjsType<YMap<T[keyof T]>, T> => {
    return new YjsObject<T>(value);
};

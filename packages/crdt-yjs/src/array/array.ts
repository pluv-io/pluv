import { Array as YArray } from "yjs";
import type { YjsType } from "../types";
import { YjsArray } from "./YjsArray";

export const array = <T extends unknown>(
    value: T[] | readonly T[] = [],
): YjsType<YArray<T>, T[]> => {
    return new YjsArray(value);
};

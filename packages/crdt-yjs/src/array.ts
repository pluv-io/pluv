import { Array as YArray } from "yjs";
import type { YjsType } from "./types";

export const array = <T extends unknown>(value: T[] | readonly T[] = []): YjsType<YArray<T>, T> => {
    const sharedType = new YArray<T>();

    !!value.length && sharedType.insert(sharedType.length, value as T[]);

    return sharedType as YjsType<YArray<T>, T>;
};

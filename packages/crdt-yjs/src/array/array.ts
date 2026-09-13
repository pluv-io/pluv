import { Array as YArray } from "yjs";

export const array = <T extends unknown>(value: T[] | readonly T[] = []): YArray<T> => {
    const shared = new YArray<T>();

    if (value.length) shared.insert(0, value as T[]);

    return shared;
};

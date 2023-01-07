import { Array as YArray } from "yjs";

export const array = <T extends unknown>(
    value: readonly T[] = []
): YArray<T> => {
    const yarray = new YArray<T>();

    yarray.push(value.slice());

    return yarray;
};

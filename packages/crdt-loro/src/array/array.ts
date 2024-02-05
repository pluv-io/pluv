import { CrdtLoroArray } from "./CrdtLoroArray";

export const array = <T extends unknown>(
    value: T[] | readonly T[] = [],
): CrdtLoroArray<T> => {
    return new CrdtLoroArray<T>(value);
};

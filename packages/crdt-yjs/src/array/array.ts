import { CrdtYjsArray } from "./CrdtYjsArray";

export const array = <T extends unknown>(
    value: T[] | readonly T[] = [],
): CrdtYjsArray<T> => {
    return new CrdtYjsArray<T>(value);
};

import { Map as YMap } from "yjs";

export const map = <T extends unknown>(
    value: readonly (readonly [key: string, value: T])[] = [],
): YMap<T> => {
    return new YMap(value);
};

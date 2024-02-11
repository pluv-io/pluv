import { CrdtLoroMap } from "./CrdtLoroMap";

export const map = <T extends unknown>(
    value: readonly (readonly [key: string, value: T])[] = [],
): CrdtLoroMap<T> => {
    return new CrdtLoroMap<T>(value);
};

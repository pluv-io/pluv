import { CrdtLoroObject } from "./CrdtLoroObject";

export const object = <T extends Record<string, any>>(
    value: T,
): CrdtLoroObject<T> => {
    return new CrdtLoroObject<T>(value);
};

import { CrdtYjsMap } from "./CrdtYjsMap";

export const map = <T extends unknown>(value: readonly (readonly [key: string, value: T])[] = []): CrdtYjsMap<T> => {
    return new CrdtYjsMap<T>(value);
};

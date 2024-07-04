import { YjsArray } from "./YjsArray";

export const array = <T extends unknown>(value: T[] | readonly T[] = []): YjsArray<T> => {
    return new YjsArray(value);
};

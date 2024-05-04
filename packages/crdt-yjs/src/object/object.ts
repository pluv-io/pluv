import { CrdtYjsObject } from "./CrdtYjsObject";

export const object = <T extends Record<string, any>>(value: T): CrdtYjsObject<T> => {
    return new CrdtYjsObject(value);
};

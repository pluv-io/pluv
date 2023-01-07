import type { JsonPrimitive } from "@pluv/types";
import type { AbstractType } from "yjs";
import { Map as YMap } from "yjs";

export type unstable__YObjectValue = Record<
    string,
    NonNullable<JsonPrimitive> | AbstractType<any>
>;

export type unstable__YObject<T extends unstable__YObjectValue> = YMap<
    T[keyof T]
> & { __$type: T };

export const unstable__object = <T extends unstable__YObjectValue = {}>(
    value: T
): unstable__YObject<T> => {
    return new YMap(Object.entries(value)) as unstable__YObject<T>;
};

import type { JsonPrimitive } from "@pluv/types";
import type { AbstractType } from "yjs";
import { Map as YMap } from "yjs";

export type YObjectValue = Record<
    string,
    NonNullable<JsonPrimitive> | AbstractType<any>
>;

export type YObject<T extends YObjectValue> = YMap<T[keyof T]> & {
    __$type: T;
};

export const object = <T extends YObjectValue = {}>(value: T): YObject<T> => {
    return new YMap(Object.entries(value)) as YObject<T>;
};

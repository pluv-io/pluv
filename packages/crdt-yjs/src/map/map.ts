import type { Map as YMap } from "yjs";
import type { YjsType } from "../types";
import { YjsMap } from "./YjsMap";

export const map = <T extends unknown>(
    value: readonly (readonly [key: string, value: T])[] = [],
): YjsType<YMap<T>, Record<string, T>> => {
    return new YjsMap<T>(value) as YjsType<YMap<T>, Record<string, T>>;
};

import { Map as YMap } from "yjs";
import type { YjsType } from "./types";

export const map = <T extends unknown>(
    value: readonly (readonly [key: string, value: T])[] = [],
): YjsType<YMap<T>, Record<string, T>> => {
    return new YMap(value);
};

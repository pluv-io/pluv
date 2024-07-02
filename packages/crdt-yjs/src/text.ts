import { Text as YText } from "yjs";
import type { YjsType } from "./types";

export const text = (value: string = ""): YjsType<YText, string> => {
    return new YText(value);
};

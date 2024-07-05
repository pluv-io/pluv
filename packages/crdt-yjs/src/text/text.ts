import type { Text as YText } from "yjs";
import type { YjsType } from "../types";
import { YjsText } from "./YjsText";

export const text = (value: string = ""): YjsType<YText, string> => {
    return new YjsText(value);
};

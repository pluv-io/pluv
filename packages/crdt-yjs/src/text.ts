import { Text as YText } from "yjs";

export const text = (value: string = ""): YText => {
    return new YText(value);
};

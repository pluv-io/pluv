import { Text as YText } from "yjs";

export const text = (value: string = ""): YText => {
    const shared = new YText();

    if (value) shared.insert(0, value);

    return shared;
};

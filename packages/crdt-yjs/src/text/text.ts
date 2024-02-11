import { CrdtYjsText } from "./CrdtYjsText";

export const text = (value: string = ""): CrdtYjsText => {
    return new CrdtYjsText(value);
};

import { CrdtLoroText } from "./CrdtLoroText";

export const text = (value: string = ""): CrdtLoroText => {
    return new CrdtLoroText(value);
};

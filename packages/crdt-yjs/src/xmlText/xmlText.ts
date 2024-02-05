import { CrdtYjsXmlText } from "./CrdtYjsXmlText";

export const xmlText = (value: string = ""): CrdtYjsXmlText => {
    return new CrdtYjsXmlText(value);
};

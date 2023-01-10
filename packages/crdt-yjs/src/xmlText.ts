import { XmlText as YXmlText } from "yjs";

export const xmlText = (value: string = ""): YXmlText => {
    return new YXmlText(value);
};

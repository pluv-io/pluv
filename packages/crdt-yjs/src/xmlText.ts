import { XmlText as YXmlText } from "yjs";
import type { YjsType } from "./types";

export const xmlText = (): YjsType<YXmlText, string> => {
    return new YXmlText();
};

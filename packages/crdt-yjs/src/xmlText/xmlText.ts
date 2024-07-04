import type { XmlText as YXmlText } from "yjs";
import { YjsType } from "../types";
import { YjsXmlText } from "./YjsXmlText";

export const xmlText = (): YjsType<YXmlText, string> => {
    return new YjsXmlText();
};

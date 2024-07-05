import type { XmlText as YXmlText, XmlElement as YXmlElement } from "yjs";
import { YjsXmlElement } from "./YjsXmlElement";

export const xmlElement = <T extends Record<string, any> = Record<string, any>>(
    name: string,
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[],
): YjsXmlElement<T> => {
    return new YjsXmlElement<T>(name, children);
};

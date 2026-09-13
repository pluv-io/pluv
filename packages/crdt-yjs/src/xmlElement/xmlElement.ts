import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { XmlElement as XmlElementCtor } from "yjs";

export const xmlElement = <T extends Record<string, any> = Record<string, any>>(
    name: string,
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[] = [],
): YXmlElement<T> => {
    const shared = new XmlElementCtor<T>(name);

    if (children.length) shared.insert(0, children as (YXmlElement | YXmlText)[]);

    return shared;
};

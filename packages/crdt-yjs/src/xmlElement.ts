import type { XmlText as YXmlText } from "yjs";
import { XmlElement as YXmlElement } from "yjs";
import type { YjsType } from "./types";

export const xmlElement = (
    name: string,
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[],
): YjsType<YXmlElement, string> => {
    const sharedType = new YXmlElement(name);

    !!children.length && sharedType.insert(sharedType.length, children as (YXmlElement | YXmlText)[]);

    return sharedType;
};

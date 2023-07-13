import type { XmlText as YXmlText } from "yjs";
import { XmlElement as YXmlElement } from "yjs";

export interface XmlElementParams {
    children?: readonly (YXmlElement | YXmlText)[];
}

export const xmlElement = (
    name: string,
    params: XmlElementParams = {},
): YXmlElement => {
    const { children = [] } = params;

    const element = new YXmlElement(name);

    element.push(children.slice());

    return element;
};

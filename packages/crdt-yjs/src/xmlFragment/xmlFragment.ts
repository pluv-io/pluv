import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { YjsXmlFragment } from "./YjsXmlFragment";

export const xmlFragment = (
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[],
): YjsXmlFragment => {
    return new YjsXmlFragment(children);
};

import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { XmlFragment as YXmlFragment } from "yjs";

export const xmlFragment = (
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[] = [],
): YXmlFragment => {
    const shared = new YXmlFragment();

    if (children.length) shared.insert(0, children as (YXmlElement | YXmlText)[]);

    return shared;
};

import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { XmlFragment as YXmlFragment } from "yjs";
import type { YjsType } from "./types";

export const xmlFragment = (
    children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[],
): YjsType<YXmlFragment, string> => {
    const sharedType = new YXmlFragment();

    !!children.length && sharedType.insert(0, children as (YXmlElement | YXmlText)[]);

    return sharedType;
};

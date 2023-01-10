import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { XmlFragment as YXmlFragment } from "yjs";

export interface XmlFragmentParams {
    children?: readonly (YXmlElement | YXmlText)[];
}

export const xmlFragment = (params: XmlFragmentParams = {}): YXmlFragment => {
    const { children = [] } = params;

    const fragment = new YXmlFragment();

    fragment.push(children.slice());

    return fragment;
};

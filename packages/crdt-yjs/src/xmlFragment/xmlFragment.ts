import type { CrdtYjsXmlElement } from "../xmlElement";
import type { CrdtYjsXmlText } from "../xmlText";
import { CrdtYjsXmlFragment } from "./CrdtYjsXmlFragment";

export const xmlFragment = (children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[]): CrdtYjsXmlFragment => {
    return new CrdtYjsXmlFragment(children);
};

import type { CrdtYjsXmlText } from "../xmlText";
import { CrdtYjsXmlElement } from "./CrdtYjsXmlElement";

export const xmlElement = (
    name: string,
    children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[],
): CrdtYjsXmlElement => {
    return new CrdtYjsXmlElement(name, children);
};

import type { CrdtYjsXmlElementParams } from "./CrdtYjsXmlElement";
import { CrdtYjsXmlElement } from "./CrdtYjsXmlElement";

export const xmlElement = (
    name: string,
    params: CrdtYjsXmlElementParams,
): CrdtYjsXmlElement => {
    return new CrdtYjsXmlElement(name, params);
};

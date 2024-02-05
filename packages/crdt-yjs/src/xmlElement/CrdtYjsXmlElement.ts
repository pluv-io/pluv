import { AbstractCrdtType } from "@pluv/crdt";
import { XmlElement as YXmlElement } from "yjs";
import type { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export interface CrdtYjsXmlElementParams {
    children?: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[];
}

export class CrdtYjsXmlElement extends AbstractCrdtType<string> {
    public value: YXmlElement;

    constructor(name: string, params: CrdtYjsXmlElementParams) {
        const { children = [] } = params;

        super();

        this.value = new YXmlElement(name);
        this.value.push(children.map((item) => item.value));
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

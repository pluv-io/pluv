import { AbstractCrdtType } from "@pluv/crdt";
import type { XmlText as YXmlText } from "yjs";
import { XmlElement as YXmlElement } from "yjs";
import type { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export class CrdtYjsXmlElement extends AbstractCrdtType<YXmlElement, string> {
    public readonly initialValue: readonly (YXmlElement | YXmlText)[];
    public value: YXmlElement;

    constructor(
        name: string,
        children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[],
    ) {
        super();

        this.initialValue = children.map((item) => item.value);
        this.value = new YXmlElement(name);
        this.value.push(this.initialValue.slice());
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

import { AbstractCrdtType } from "@pluv/crdt";
import type { XmlElement as YXmlElement, XmlText as YXmlText } from "yjs";
import { XmlFragment as YXmlFragment } from "yjs";
import type { CrdtYjsXmlElement } from "../xmlElement/CrdtYjsXmlElement";
import type { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export class CrdtYjsXmlFragment extends AbstractCrdtType<YXmlFragment, string> {
    public readonly initialValue: readonly (YXmlElement | YXmlText)[];
    public value: YXmlFragment;

    constructor(children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[]) {
        super();

        this.initialValue = children.map((item) => item.value);
        this.value = new YXmlFragment();
        this.value.push(this.initialValue.slice());
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

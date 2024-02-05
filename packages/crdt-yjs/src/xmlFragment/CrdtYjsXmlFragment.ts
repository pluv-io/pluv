import { AbstractCrdtType } from "@pluv/crdt";
import { XmlFragment as YXmlFragment } from "yjs";
import type { CrdtYjsXmlElement } from "../xmlElement/CrdtYjsXmlElement";
import type { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export interface CrdtYjsXmlFragmentParams {
    children?: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[];
}

export class CrdtYjsXmlFragment extends AbstractCrdtType<string> {
    public value: YXmlFragment;

    constructor(params: CrdtYjsXmlFragmentParams) {
        const { children = [] } = params;

        super();

        this.value = new YXmlFragment();
        this.value.push(children.map((item) => item.value));
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

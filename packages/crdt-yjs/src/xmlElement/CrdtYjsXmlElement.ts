import { AbstractCrdtType } from "@pluv/crdt";
import type { XmlText as YXmlText } from "yjs";
import { XmlElement as YXmlElement } from "yjs";
import { toYjsValue } from "../shared";
import type { CrdtYjsXmlText } from "../xmlText/CrdtYjsXmlText";

export class CrdtYjsXmlElement extends AbstractCrdtType<YXmlElement, string> {
    public readonly initialValue: readonly (YXmlElement | YXmlText)[];
    public readonly name: string;
    public value: YXmlElement;

    constructor(
        name: string,
        children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[],
    ) {
        super();

        this.initialValue = children.map((item) => item.value);
        this.name = name;
        this.value = new YXmlElement(name);
        this.value.push(this.initialValue.slice());
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(
        index: number,
        ...children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[]
    ): this {
        const converted = children.map((child) => toYjsValue(child));

        this.value.insert(index, converted);

        return this;
    }

    public push(
        ...children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[]
    ): this {
        return this.insert(this.length, ...children);
    }

    public unshift(
        ...children: readonly (CrdtYjsXmlElement | CrdtYjsXmlText)[]
    ): this {
        return this.insert(0, ...children);
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

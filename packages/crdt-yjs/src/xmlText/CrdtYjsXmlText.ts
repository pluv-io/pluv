import { AbstractCrdtType } from "@pluv/crdt";
import { XmlText as YXmlText } from "yjs";

export class CrdtYjsXmlText extends AbstractCrdtType<YXmlText, string> {
    public readonly initialValue: string;
    public value: YXmlText;

    constructor(value: string = "") {
        super();

        this.initialValue = value;
        this.value = new YXmlText(value);
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, text: string, attributes?: Record<string, string>): this {
        this.value.insert(index, text, attributes);

        return this;
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

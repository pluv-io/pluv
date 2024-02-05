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

    public toJson(): string {
        return this.value.toJSON();
    }
}

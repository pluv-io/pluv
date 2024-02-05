import { AbstractCrdtType } from "@pluv/crdt";
import { XmlText as YXmlText } from "yjs";

export class CrdtYjsXmlText extends AbstractCrdtType<string> {
    public value: YXmlText;

    constructor(value: string = "") {
        super();

        this.value = new YXmlText(value);
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

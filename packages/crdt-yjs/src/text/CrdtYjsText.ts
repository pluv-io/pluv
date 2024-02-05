import { AbstractCrdtType } from "@pluv/crdt";
import { Text as YText } from "yjs";

export class CrdtYjsText extends AbstractCrdtType<YText, string> {
    public readonly initialValue: string;
    public value: YText;

    constructor(value: string = "") {
        super();

        this.initialValue = value;
        this.value = new YText(value);
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

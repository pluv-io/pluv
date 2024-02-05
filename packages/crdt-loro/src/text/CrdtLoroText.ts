import { AbstractCrdtType } from "@pluv/crdt";
import { LoroText } from "loro-crdt";

export class CrdtLoroText extends AbstractCrdtType<LoroText, string> {
    public initalValue: string;
    public value: LoroText;

    constructor(value: string = "") {
        super();

        this.initalValue = value;
        this.value = new LoroText();

        this.value.insert(0, value);
    }

    public toJson(): string {
        return this.value.toString();
    }
}

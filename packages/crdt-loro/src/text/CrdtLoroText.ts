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

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, text: string): this {
        this.value.insert(index, text);

        return this;
    }

    public toJson(): string {
        return this.value.toString();
    }
}

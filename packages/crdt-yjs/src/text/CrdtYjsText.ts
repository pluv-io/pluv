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
        return this.value.toJSON();
    }
}

import type {
    AbstractCrdtTextDeleteParams,
    AbstractCrdtTextInsertParams,
} from "@pluv/crdt";
import { AbstractCrdtText } from "@pluv/crdt";
import { LoroText } from "loro-crdt";

export type CrdtLoroTextDeleteParams = AbstractCrdtTextDeleteParams;
export type CrdtLoroTextInsertParams = AbstractCrdtTextInsertParams;

export class CrdtLoroText extends AbstractCrdtText {
    public value: LoroText;

    constructor(value: string = "") {
        super();

        this.value = new LoroText();

        this.value.insert(0, value);
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(params: CrdtLoroTextDeleteParams): number {
        const { index, length = this.value.length } = params;

        this.value.delete(index, length);

        return this.length;
    }

    public insert(params: CrdtLoroTextInsertParams): number {
        const { index, text } = params;

        this.value.insert(index, text);

        return this.length;
    }

    public toJson(): string {
        return this.value.toString();
    }
}

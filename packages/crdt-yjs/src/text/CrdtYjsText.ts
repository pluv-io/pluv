import type {
    AbstractCrdtTextDeleteParams,
    AbstractCrdtTextInsertParams,
} from "@pluv/crdt";
import { AbstractCrdtText } from "@pluv/crdt";
import { Text as YText } from "yjs";

export type CrdtYjsTextDeleteParams = AbstractCrdtTextDeleteParams;
export type CrdtYjsTextInsertParams = AbstractCrdtTextInsertParams;

export class CrdtYjsText extends AbstractCrdtText {
    public value: YText;

    constructor(value: string = "") {
        super();

        this.value = new YText(value);
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(params: CrdtYjsTextDeleteParams): number {
        const { index, length = this.value.length } = params;

        this.value.delete(index, length);

        return this.length;
    }

    public insert(params: AbstractCrdtTextInsertParams): number {
        const { index, text } = params;

        this.value.insert(index, text);

        return this.length;
    }

    public toJson(): string {
        return this.value.toJSON();
    }
}

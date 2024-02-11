import { AbstractCrdtType } from "@pluv/crdt";
import { LoroText } from "loro-crdt";
import type { CrdtLoroDoc } from "../doc/CrdtLoroDoc";
import { cloneType } from "../shared";

export class CrdtLoroText extends AbstractCrdtType<LoroText, string> {
    public initalValue: string;

    private _doc: CrdtLoroDoc<any> | null = null;
    private _initialized: boolean = false;
    private _value: LoroText = new LoroText();

    constructor(value: string = "") {
        super();

        this.initalValue = value;
        this.value = new LoroText();
    }

    public set doc(doc: CrdtLoroDoc<any>) {
        if (this._doc) throw new Error("Cannot overwrite array doc");

        this._doc = doc;
    }

    public get length(): number {
        return this.value.length;
    }

    public get value(): LoroText {
        return this._value;
    }

    public set value(value: LoroText) {
        if (this._initialized) throw new Error("Cannot re-assign text");

        this._initialized = true;
        this._value = value;

        cloneType({ source: this, target: this.value });
    }

    public delete(index: number, length: number = 1): this {
        this._guardInitialized();

        this.value.delete(index, length);
        this._doc?.value.commit();

        return this;
    }

    public insert(index: number, text: string): this {
        this._guardInitialized();

        this.value.insert(index, text);
        this._doc?.value.commit();

        return this;
    }

    public toJson(): string {
        return this.value.toString();
    }

    private _guardInitialized(): void {
        if (!this._initialized) throw new Error("Array is not yet initialized");
    }
}

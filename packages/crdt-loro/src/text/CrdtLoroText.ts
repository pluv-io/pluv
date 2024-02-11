import { AbstractCrdtType } from "@pluv/crdt";
import { LoroText } from "loro-crdt";
import { cloneType } from "../shared";

export class CrdtLoroText extends AbstractCrdtType<LoroText, string> {
    public initalValue: string;

    private _initialized: boolean = false;
    private _value: LoroText = new LoroText();

    constructor(value: string = "") {
        super();

        this.initalValue = value;
        this.value = new LoroText();
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

        return this;
    }

    public insert(index: number, text: string): this {
        this._guardInitialized();

        this.value.insert(index, text);

        return this;
    }

    public toJson(): string {
        return this.value.toString();
    }

    private _guardInitialized(): void {
        if (!this._initialized) throw new Error("Array is not yet initialized");
    }
}

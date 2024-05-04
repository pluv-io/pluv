import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { LoroMap } from "loro-crdt";
import type { CrdtLoroDoc } from "../doc/CrdtLoroDoc";
import { cloneType, getLoroContainerType, isWrapper } from "../shared";
import type { InferLoroJson } from "../types";

export class CrdtLoroObject<T extends Record<string, any>> extends AbstractCrdtType<LoroMap<T>, InferLoroJson<T>> {
    public readonly initialValue: readonly (readonly [key: string, value: T])[];

    private _doc: CrdtLoroDoc<any> | null = null;
    private _initialized: boolean = false;
    private _value: LoroMap<T> = new LoroMap();

    constructor(value: T) {
        super();

        this.initialValue = Object.entries(value).map(([k, v]) => [k, v] as [key: string, value: T]);
    }

    public set doc(doc: CrdtLoroDoc<any>) {
        if (this._doc) throw new Error("Cannot overwrite array doc");

        this._doc = doc;
    }

    public get size(): number {
        return this.value.size;
    }

    public get value(): LoroMap<T> {
        return this._value;
    }

    public set value(value: LoroMap<T>) {
        if (this._initialized) throw new Error("Cannot re-assign map");

        this._initialized = true;
        this._value = value;

        cloneType({ source: this, target: this.value });
    }

    public set(prop: string, value: T): this {
        this._guardInitialized();

        if (!(value instanceof AbstractCrdtType)) {
            this.value.set(prop, value);
            this._doc?.value.commit();

            return this;
        }

        if (!isWrapper(value)) {
            throw new Error("This type is not yet supported");
        }

        const containerType = getLoroContainerType(value);
        const container = this.value.setContainer(prop, containerType);

        cloneType({ source: value, target: container as any });
        if (this._doc) value.doc = this._doc;

        this._doc?.value.commit();

        return this;
    }

    public toJson(): InferCrdtStorageJson<InferLoroJson<T>> {
        return this.value.toJson() as InferCrdtStorageJson<InferLoroJson<T>>;
    }

    private _guardInitialized(): void {
        if (!this._initialized) throw new Error("Array is not yet initialized");
    }
}

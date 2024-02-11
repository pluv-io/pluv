import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { LoroList } from "loro-crdt";
import { cloneType, getLoroContainerType } from "../shared";
import type { InferLoroJson } from "../types";

export class CrdtLoroArray<T extends unknown> extends AbstractCrdtType<
    LoroList<T[]>,
    InferLoroJson<T>[]
> {
    public readonly initialValue: T[] | readonly T[];

    private _initialized: boolean = false;
    private _value: LoroList<T[]> = new LoroList();

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.initialValue = value.slice();
    }

    public get length(): number {
        return this.value.length;
    }

    public get value(): LoroList<T[]> {
        return this._value;
    }

    public set value(value: LoroList<T[]>) {
        if (this._initialized) throw new Error("Cannot re-assign array");

        this._initialized = true;
        this._value = value;

        cloneType({ source: this, target: this.value });
    }

    public delete(index: number, length: number = 1): this {
        this._guardInitialized();

        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, ...items: T[]): this {
        this._guardInitialized();

        items.forEach((item, i) => {
            if (!(item instanceof AbstractCrdtType)) {
                this.value.insert(index + i, item);

                return this;
            }

            const containerType = getLoroContainerType(item);
            const container = this.value.insertContainer(
                index + i,
                containerType,
            );

            cloneType({ source: item as any, target: container as any });

            return this;
        });

        return this;
    }

    public push(...items: T[]): this {
        return this.insert(this.length, ...items);
    }

    public unshift(...items: T[]): this {
        return this.insert(0, ...items);
    }

    public toJson(): InferCrdtStorageJson<InferLoroJson<T>>[] {
        return this.value.toJson();
    }

    private _guardInitialized(): void {
        if (!this._initialized) throw new Error("Array is not yet initialized");
    }
}

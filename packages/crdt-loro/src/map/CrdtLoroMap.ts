import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtType } from "@pluv/crdt";
import { LoroMap } from "loro-crdt";
import { cloneType, getLoroContainerType } from "../shared";
import type { InferLoroJson } from "../types";

export class CrdtLoroMap<T extends unknown> extends AbstractCrdtType<
    LoroMap<Record<string, T>>,
    Record<string, InferLoroJson<T>>
> {
    public readonly initialValue: readonly (readonly [key: string, value: T])[];

    private _initialized: boolean = false;
    private _value: LoroMap<Record<string, T>> = new LoroMap();

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super();

        this.initialValue = value.map(
            ([k, v]) => [k, v] as [key: string, value: T],
        );
    }

    public get size(): number {
        return this.value.size;
    }

    public get value(): LoroMap<Record<string, T>> {
        return this._value;
    }

    public set value(value: LoroMap<Record<string, T>>) {
        if (this._initialized) throw new Error("Cannot re-assign map");

        this._initialized = true;
        this._value = value;

        cloneType({ source: this, target: this.value });
    }

    public delete(prop: string): this {
        this._guardInitialized();

        this.value.delete(prop);

        return this;
    }

    public set(prop: string, value: T): this {
        this._guardInitialized();

        if (!(value instanceof AbstractCrdtType)) {
            this.value.set(prop, value);

            return this;
        }

        const containerType = getLoroContainerType(value);
        const container = this.value.setContainer(prop, containerType);

        cloneType({
            source: value as any,
            target: container as any,
        });

        return this;
    }

    public toJson(): InferCrdtStorageJson<Record<string, InferLoroJson<T>>> {
        return this.value.toJson();
    }

    private _guardInitialized(): void {
        if (!this._initialized) throw new Error("Array is not yet initialized");
    }
}

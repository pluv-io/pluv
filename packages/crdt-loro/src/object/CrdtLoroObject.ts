import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { LoroMap } from "loro-crdt";
import { toLoroValue } from "../shared";
import type { InferLoroJson, InferLoroType } from "../types";

export class CrdtLoroObject<
    T extends Record<string, any>,
> extends AbstractCrdtType<LoroMap<T>, InferLoroJson<T>> {
    public readonly initialValue: readonly (readonly [
        key: string,
        value: InferLoroType<T>,
    ])[];
    public value: LoroMap<T>;

    constructor(value: T) {
        super();

        this.initialValue = Object.entries(value).map(([k, v]) => [
            k,
            toLoroValue(v),
        ]) as readonly (readonly [key: string, value: InferLoroType<T>])[];
        this.value = new LoroMap();

        this.initialValue.forEach(([k, v]) => {
            this.value.set(k, v);
        });
    }

    public set(prop: string, value: T): this {
        this.value.set(prop, toLoroValue(value));

        return this;
    }

    public toJson(): InferCrdtStorageJson<InferLoroJson<T>> {
        return this.value.toJson() as InferCrdtStorageJson<InferLoroJson<T>>;
    }
}

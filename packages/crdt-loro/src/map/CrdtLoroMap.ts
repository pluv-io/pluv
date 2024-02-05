import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtType } from "@pluv/crdt";
import { LoroMap } from "loro-crdt";
import { isWrapper } from "../shared";
import type { InferLoroJson, InferLoroType } from "../types";

export class CrdtLoroMap<T extends unknown> extends AbstractCrdtType<
    LoroMap<Record<string, T>>,
    Record<string, InferLoroJson<T>>
> {
    public readonly initialValue: readonly (readonly [
        key: string,
        value: InferLoroType<T>,
    ])[];
    public value: LoroMap<Record<string, T>>;

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super();

        this.initialValue = value.map(([k, v]) => [
            k,
            isWrapper(v) ? v.value : v,
        ]) as readonly (readonly [key: string, value: InferLoroType<T>])[];
        this.value = new LoroMap();

        this.initialValue.forEach(([k, v]) => {
            this.value.set(k, v);
        });
    }

    public toJson(): InferCrdtStorageJson<Record<string, InferLoroJson<T>>> {
        return this.value.toJson();
    }
}

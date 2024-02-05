import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtType } from "@pluv/crdt";
import { Array as YArray } from "yjs";
import { toYjsValue } from "../shared";
import type { InferYjsJson, InferYjsType } from "../types";

export class CrdtYjsArray<T extends unknown> extends AbstractCrdtType<
    YArray<InferYjsType<T>>,
    InferYjsJson<T>[]
> {
    public readonly initialValue:
        | InferYjsType<T>[]
        | readonly InferYjsType<T>[];
    public value: YArray<InferYjsType<T>>;

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.initialValue = value.map((item) => toYjsValue(item));
        this.value = new YArray<InferYjsType<T>>();
        this.value.push(this.initialValue.slice());
    }

    public toJson(): InferCrdtStorageJson<InferYjsJson<T>>[] {
        return this.value.toJSON();
    }
}

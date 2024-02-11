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

        const initialValue = value.map((item) => toYjsValue(item));

        this.initialValue = initialValue;
        this.value = new YArray<InferYjsType<T>>();
        this.push(...value);
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, ...items: T[]): this {
        const converted = items.map((item) => toYjsValue(item));

        this.value.insert(index, converted);

        return this;
    }

    public push(...items: T[]): this {
        return this.insert(this.length, ...items);
    }

    public unshift(...items: T[]): this {
        return this.insert(0, ...items);
    }

    public toJson(): InferCrdtStorageJson<InferYjsJson<T>>[] {
        return this.value.toJSON();
    }
}

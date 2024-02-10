import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtType } from "@pluv/crdt";
import { Array as YArray } from "yjs";
import { isWrapper, toYjsValue } from "../shared";
import type { InferYjsJson, InferYjsType } from "../types";

export class CrdtYjsArray<T extends unknown> extends AbstractCrdtType<
    YArray<T>,
    InferYjsJson<T>[]
> {
    public readonly initialValue: T[] | readonly T[];
    public value: YArray<T>;

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.initialValue = value.map((item) => toYjsValue(item));
        this.value = new YArray<T>();
        this.value.push(this.initialValue.slice());
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, ...items: T[]): this {
        const converted = items.map((item) => toYjsValue(item)) as T[];

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

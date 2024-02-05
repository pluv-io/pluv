import type {
    AbstractCrdtArrayDeleteParams,
    AbstractCrdtArrayInsertParams,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import { AbstractCrdtArray } from "@pluv/crdt";
import { Array as YArray } from "yjs";
import { isWrapper, toYjsValue } from "../shared";

export type CrdtYjsArrayDeleteParams = AbstractCrdtArrayDeleteParams;
export type CrdtYjsArrayInsertParams<T extends unknown> =
    AbstractCrdtArrayInsertParams<T>;

export class CrdtYjsArray<T extends unknown> extends AbstractCrdtArray<T> {
    public initialValue: T[] | readonly T[];
    public value: YArray<T>;

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.initialValue = value.map((item) => toYjsValue(item));

        this.value = new YArray<T>();
        this.push(...value.slice());
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(params: CrdtYjsArrayDeleteParams): number {
        const { index, length = this.value.length } = params;

        this.value.delete(index, length);

        return this.length;
    }

    public insert(params: CrdtYjsArrayInsertParams<T>): number {
        const { index, items } = params;

        this.value.insert(
            index,
            items.map((item) => toYjsValue(item)),
        );

        return this.length;
    }

    public pop(): T | undefined {
        const result = this.value.get(this.value.length - 1);

        this.value.delete(this.value.length - 1, 1);

        return result;
    }

    public push(...items: T[]): number {
        this.insert({ index: this.length, items });

        return this.length;
    }

    public toJson(): InferCrdtStorageJson<T>[] {
        return this.value.toJSON();
    }

    public unshift(...items: T[]): number {
        this.insert({ index: 0, items });

        return this.length;
    }
}

import type {
    AbstractCrdtArrayDeleteParams,
    AbstractCrdtArrayInsertParams,
    InferCrdtStorageJson,
} from "@pluv/crdt";
import { AbstractCrdtArray } from "@pluv/crdt";
import { LoroList, getType, isContainer } from "loro-crdt";
import { cloneType, isWrapper } from "../shared";

export type CrdtLoroArrayDeleteParams = AbstractCrdtArrayDeleteParams;
export type CrdtLoroArrayInsertParams<T extends unknown> =
    AbstractCrdtArrayInsertParams<T>;

export class CrdtLoroArray<T extends unknown> extends AbstractCrdtArray<T> {
    public value: LoroList<T[]>;

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.value = new LoroList();

        this.insert({
            index: 0,
            items: value.slice(),
        });
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(params: CrdtLoroArrayDeleteParams): number {
        const { index, length = this.value.length } = params;

        this.value.delete(index, length);

        return this.length;
    }

    public insert(params: CrdtLoroArrayInsertParams<T>): number {
        const { index, items } = params;

        items.forEach((item, i) => {
            const source = isWrapper(item) ? item.value : item;

            if (isContainer(source)) {
                const containerType = getType(source);
                const target = this.value.insertContainer(
                    index + i,
                    containerType,
                );

                cloneType({ source, target });

                return;
            }

            this.value.insert(index + i, item);
        });

        return this.length;
    }

    public pop(): T | undefined {
        const result = this.value.get(this.value.length - 1);

        this.value.delete(this.value.length - 1, 1);

        return result as T;
    }

    public push(...items: T[]): number {
        this.insert({ index: items.length, items });

        return this.length;
    }

    public toJson(): InferCrdtStorageJson<T>[] {
        return this.value.toJson();
    }

    public unshift(...items: T[]): number {
        items.forEach((item, i) => {
            this.value.insert(i, items);
        });

        return this.length;
    }
}

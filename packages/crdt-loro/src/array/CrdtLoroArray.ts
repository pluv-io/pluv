import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { LoroList, getType, isContainer } from "loro-crdt";
import { cloneType, toLoroValue } from "../shared";
import type { InferLoroJson, InferLoroType } from "../types";

export class CrdtLoroArray<T extends unknown> extends AbstractCrdtType<
    LoroList<T[]>,
    InferLoroJson<T>[]
> {
    public readonly initialValue: InferLoroType<T>[];
    public value: LoroList<T[]>;

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.initialValue = value.map((item) =>
            toLoroValue(item),
        ) as InferLoroType<T>[];
        this.value = new LoroList();

        this.initialValue.slice().forEach((item, i) => {
            const source = toLoroValue(item);

            if (isContainer(source)) {
                const containerType = getType(source);
                const target = this.value.insertContainer(i, containerType);

                cloneType({ source, target });

                return;
            }

            this.value.insert(i, item);
        });
    }

    public get length(): number {
        return this.value.length;
    }

    public delete(index: number, length: number = 1): this {
        this.value.delete(index, length);

        return this;
    }

    public insert(index: number, ...items: T[]): this {
        const converted = items.map((item) => toLoroValue(item)) as T[];

        converted.forEach((item, i) => {
            this.value.insert(index + i, item);
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
}

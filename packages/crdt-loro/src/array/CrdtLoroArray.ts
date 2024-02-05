import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { LoroList, getType, isContainer } from "loro-crdt";
import { cloneType, isWrapper } from "../shared";
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
            isWrapper(item) ? item.value : item,
        ) as InferLoroType<T>[];
        this.value = new LoroList();

        this.initialValue.slice().forEach((item, i) => {
            const source = isWrapper(item) ? item.value : item;

            if (isContainer(source)) {
                const containerType = getType(source);
                const target = this.value.insertContainer(i, containerType);

                cloneType({ source, target });

                return;
            }

            this.value.insert(i, item);
        });
    }

    public toJson(): InferCrdtStorageJson<InferLoroJson<T>>[] {
        return this.value.toJson();
    }
}

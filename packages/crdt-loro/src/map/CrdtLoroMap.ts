import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtObject } from "@pluv/crdt";
import { LoroMap, getType, isContainer } from "loro-crdt";
import { cloneType, isWrapper } from "../shared";

export class CrdtLoroMap<T extends unknown> extends AbstractCrdtObject<
    Record<string, T>
> {
    public value: LoroMap<Record<string, T>>;

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super();

        this.value = new LoroMap();
        value.forEach(([key, item]) => {
            this.set(key, item);
        });
    }

    public get size(): number {
        return this.value.size;
    }

    public get(prop: string): T | undefined {
        const result = this.value.get(prop) as T;

        return result;
    }

    public set(prop: string, item: T): this {
        const source = isWrapper(item) ? item.value : item;

        if (isContainer(source)) {
            const containerType = getType(source);
            const target = this.value.setContainer(prop, containerType);

            cloneType({ source, target });

            return this;
        }

        this.value.set(prop, item);

        return this;
    }

    public toJson(): Record<string, InferCrdtStorageJson<T>> {
        return this.value.toJson();
    }
}

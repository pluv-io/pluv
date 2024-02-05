import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtObject } from "@pluv/crdt";
import { LoroMap, getType, isContainer } from "loro-crdt";
import { cloneType, isWrapper } from "../shared";

export class CrdtLoroObject<
    T extends Record<string, any>,
> extends AbstractCrdtObject<T> {
    public value: LoroMap<T>;

    constructor(value: T) {
        super();

        this.value = new LoroMap();
        Object.entries(value).forEach(([key, item]) => {
            this.set(key, item);
        });
    }

    public get size(): number {
        return this.value.size;
    }

    public get<P extends keyof T>(prop: P): T[P] | undefined {
        const result = this.value.get(prop.toString()) as T[P];

        return result;
    }

    public set<P extends keyof T>(prop: P, item: T[P]): this {
        const source = isWrapper(item) ? (item as any).value : item;

        if (isContainer(source)) {
            const containerType = getType(source);
            const target = this.value.setContainer(
                prop.toString(),
                containerType,
            );

            cloneType({ source, target });

            return this;
        }

        this.value.set(prop.toString(), item);

        return this;
    }

    public toJson(): InferCrdtStorageJson<T> {
        return this.value.toJson() as InferCrdtStorageJson<T>;
    }
}

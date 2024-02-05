import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtObject } from "@pluv/crdt";
import { Map as YMap } from "yjs";
import { isWrapper } from "../shared";

export class CrdtYjsObject<
    T extends Record<string, any>,
> extends AbstractCrdtObject<T> {
    public value: YMap<T[keyof T]>;

    constructor(value: T = {} as T) {
        super();

        this.value = new YMap(Object.entries(value));
    }

    public get size(): number {
        return this.value.size;
    }

    public get<P extends keyof T>(prop: P): T[P] | undefined {
        const result = this.value.get(prop.toString());

        return result;
    }

    public set<P extends keyof T>(prop: P, value: T[P]): this {
        const toSet = isWrapper(value) ? (value as any).value : value;

        this.value.set(prop.toString(), toSet);

        return this;
    }

    public toJson(): InferCrdtStorageJson<T> {
        return this.value.toJSON() as InferCrdtStorageJson<T>;
    }
}

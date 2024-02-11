import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtType } from "@pluv/crdt";
import { Map as YMap } from "yjs";
import { toYjsValue } from "../shared";
import type { InferYjsJson, InferYjsType } from "../types";

export class CrdtYjsMap<T extends unknown> extends AbstractCrdtType<
    YMap<T>,
    Record<string, InferYjsJson<T>>
> {
    public initialValue: readonly (readonly [
        key: string,
        value: InferYjsType<T>,
    ])[];
    public value: YMap<T>;

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super();

        this.initialValue = value.map(([k, v]) => [k, toYjsValue(v)]);
        this.value = new YMap(this.initialValue);
    }

    public get size(): number {
        return this.value.size;
    }

    public delete(prop: string): this {
        this.value.delete(prop);

        return this;
    }

    public set(prop: string, value: T): this {
        this.value.set(prop, toYjsValue(value));

        return this;
    }

    public toJson(): InferCrdtStorageJson<Record<string, InferYjsJson<T>>> {
        return this.value.toJSON();
    }
}

import { AbstractCrdtType, type InferCrdtStorageJson } from "@pluv/crdt";
import { Map as YMap } from "yjs";
import { toYjsValue } from "../shared";
import type { InferYjsJson, InferYjsType } from "../types";

export class CrdtYjsObject<
    T extends Record<string, any>,
> extends AbstractCrdtType<YMap<InferYjsType<T[keyof T]>>, InferYjsJson<T>> {
    public initialValue: readonly (readonly [
        key: string,
        value: InferYjsType<T[keyof T]>,
    ])[];
    public value: YMap<InferYjsType<T[keyof T]>>;

    constructor(value: T = {} as T) {
        super();

        this.initialValue = Object.entries(value).map(
            ([k, v]) =>
                [k, toYjsValue(v)] as readonly [
                    key: string,
                    value: InferYjsType<T[keyof T]>,
                ],
        );
        this.value = new YMap(this.initialValue);
    }

    public set(prop: string, value: T): this {
        this.value.set(prop, toYjsValue(value));

        return this;
    }

    public toJson(): InferCrdtStorageJson<InferYjsJson<T>> {
        return this.value.toJSON() as InferCrdtStorageJson<InferYjsJson<T>>;
    }
}

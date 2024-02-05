import type { InferCrdtStorageJson } from "@pluv/crdt";
import { AbstractCrdtObject } from "@pluv/crdt";
import { Map as YMap } from "yjs";
import { toYjsValue } from "../shared";

export class CrdtYjsMap<T extends unknown> extends AbstractCrdtObject<
    Record<string, T>
> {
    public initialValue: readonly (readonly [key: string, value: T])[];
    public value: YMap<T>;

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super();

        this.initialValue = value.map(
            ([k, v]) => [k, toYjsValue(v)] as [key: string, value: T],
        );

        this.value = new YMap(value);
    }

    public get size(): number {
        return this.value.size;
    }

    public get(prop: string): T | undefined {
        const result = this.value.get(prop);

        return result;
    }

    public set(prop: string, value: T): this {
        this.value.set(prop, toYjsValue(value));

        return this;
    }

    public toJson(): Record<string, InferCrdtStorageJson<T>> {
        return this.value.toJSON();
    }
}

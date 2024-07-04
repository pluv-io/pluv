import { Array as YArray } from "yjs";
import type { YjsType } from "../types";

export class YjsArray<T extends unknown> extends YArray<T> implements YjsType<YArray<T>, T[]> {
    public initialValue?: T[] | readonly T[];

    constructor(value: T[] | readonly T[] = []) {
        super();

        this.insert(0, value as T[]);

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as any;
    }
}

import { Map as YMap } from "yjs";
import type { YjsType } from "../types";

export class YjsObject<T extends Record<string, any>>
    extends YMap<T[keyof T]>
    implements YjsType<YMap<T[keyof T]>, T>
{
    public initialValue?: T;

    constructor(value: T) {
        super(Object.entries(value));

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as unknown as any;
    }
}

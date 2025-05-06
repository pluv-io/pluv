import { Map as YMap } from "yjs";
import type { YjsType } from "../types";

export class YjsMap<T extends unknown>
    extends YMap<T>
    implements YjsType<YMap<T>, Record<string, T>>
{
    public initialValue?: readonly (readonly [key: string, value: T])[];

    constructor(value: readonly (readonly [key: string, value: T])[] = []) {
        super(value);

        this.initialValue = value;
    }

    public __pluvType(): any {
        return {} as any;
    }
}

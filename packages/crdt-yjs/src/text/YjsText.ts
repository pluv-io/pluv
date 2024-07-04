import { Text as YText } from "yjs";
import type { YjsType } from "../types";

export class YjsText extends YText implements YjsType<YText, string> {
    public initialValue?: string;

    constructor(value: string = "") {
        super();

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as unknown as any;
    }
}

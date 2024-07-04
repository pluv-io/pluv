import { XmlText as YXmlText } from "yjs";
import type { YjsType } from "../types";

export class YjsXmlText extends YXmlText implements YjsType<YXmlText, string> {
    public initialValue?: string;

    constructor(value: string = "") {
        super();

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as unknown as any;
    }
}

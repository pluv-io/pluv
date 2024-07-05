import type { XmlText as YXmlText } from "yjs";
import { XmlElement as YXmlElement } from "yjs";
import type { YjsType } from "../types";

export class YjsXmlElement<T extends Record<string, any> = Record<string, any>>
    extends YXmlElement<T>
    implements YjsType<YXmlElement, string>
{
    public initialValue?: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[];

    constructor(name: string, value: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[]) {
        super(name);

        !!value.length && this.insert(0, value as (YXmlElement | YXmlText)[]);

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as unknown as any;
    }
}

import type { XmlText as YXmlText, XmlElement as YXmlElement } from "yjs";
import { XmlFragment as YXmlFragment } from "yjs";
import type { YjsType } from "../types";

export class YjsXmlFragment extends YXmlFragment implements YjsType<YXmlFragment, string> {
    public initialValue?: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[];

    constructor(value: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[]) {
        super();

        !!value.length && this.insert(0, value as (YXmlElement | YXmlText)[]);

        this.initialValue = value;
    }

    public __pluvType() {
        return {} as unknown as any;
    }
}

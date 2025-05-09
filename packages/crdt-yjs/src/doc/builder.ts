import {
    Array as YArray,
    Doc as YDoc,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
} from "yjs";
import { YjsType } from "../types";

export type YjsBuilder = ReturnType<typeof builder>;

export const builder = (doc: YDoc) => {
    return {
        array<T extends unknown>(
            name: string,
            value: T[] | readonly T[] = [],
        ): YjsType<YArray<T>, T[]> {
            const array = doc.getArray<T>(name);

            if (!!value.length) array.insert(0, value as T[]);

            return array as unknown as YjsType<YArray<T>, T[]>;
        },
        map<T extends unknown>(
            name: string,
            value: readonly (readonly [key: string, value: T])[] = [],
        ): YjsType<YMap<T>, Record<string, T>> {
            const map = doc.getMap(name);

            value.forEach(([k, v]) => {
                map.set(k, v);
            });

            return map as unknown as YjsType<YMap<T>, Record<string, T>>;
        },
        text(name: string, value: string = ""): YjsType<YText, string> {
            const text = doc.getText(name);

            if (!!value) text.insert(0, value);

            return text as unknown as YjsType<YText, string>;
        },
        xmlElement(
            name: string,
            children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[] = [],
        ): YjsType<YXmlElement, string> {
            const xmlElement = doc.getXmlElement(name);

            if (!!children.length) xmlElement.insert(0, children as (YXmlElement | YXmlText)[]);

            return xmlElement as unknown as YjsType<YXmlElement, string>;
        },
        xmlFragment(
            name: string,
            children: (YXmlElement | YXmlText)[] | readonly (YXmlElement | YXmlText)[] = [],
        ): YjsType<YXmlFragment, string> {
            const xmlFragment = doc.getXmlFragment(name);

            if (!!children.length) xmlFragment.insert(0, children as (YXmlElement | YXmlText)[]);

            return xmlFragment as unknown as YjsType<YXmlFragment, string>;
        },
        xmlText(name: string): YjsType<YXmlText, string> {
            const xmlText = doc.get(name, YXmlText);

            return xmlText as unknown as YjsType<YXmlText, string>;
        },
    };
};

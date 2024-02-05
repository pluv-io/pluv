import type { Json } from "@pluv/types";
import type {
    Array as YArray,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
} from "yjs";
import type { CrdtYjsArray } from "./array";
import type { CrdtYjsMap } from "./map";
import type { CrdtYjsObject } from "./object";
import type { CrdtYjsText } from "./text";
import type { CrdtYjsXmlElement } from "./xmlElement";
import type { CrdtYjsXmlFragment } from "./xmlFragment";
import type { CrdtYjsXmlText } from "./xmlText";

export type InferYjsType<T extends unknown> =
    T extends CrdtYjsArray<infer IType>
        ? YArray<IType>
        : T extends CrdtYjsMap<infer IType>
          ? YMap<IType>
          : T extends CrdtYjsObject<infer IType>
            ? YMap<IType[keyof IType]>
            : T extends CrdtYjsText
              ? YText
              : T extends CrdtYjsXmlElement
                ? YXmlElement
                : T extends CrdtYjsXmlFragment
                  ? YXmlFragment
                  : T extends CrdtYjsXmlText
                    ? YXmlText
                    : T extends Json
                      ? T
                      : never;

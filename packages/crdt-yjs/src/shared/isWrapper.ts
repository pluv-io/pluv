import { CrdtYjsArray } from "../array/CrdtYjsArray";
import { CrdtYjsMap } from "../map/CrdtYjsMap";
import { CrdtYjsObject } from "../object/CrdtYjsObject";
import { CrdtYjsText } from "../text/CrdtYjsText";
import { CrdtYjsXmlElement } from "../xmlElement";
import { CrdtYjsXmlFragment } from "../xmlFragment";
import { CrdtYjsXmlText } from "../xmlText";

export const isWrapper = (
    item: any,
): item is
    | CrdtYjsArray<any>
    | CrdtYjsMap<any>
    | CrdtYjsObject<any>
    | CrdtYjsText => {
    return (
        item instanceof CrdtYjsArray ||
        item instanceof CrdtYjsMap ||
        item instanceof CrdtYjsObject ||
        item instanceof CrdtYjsText ||
        item instanceof CrdtYjsXmlElement ||
        item instanceof CrdtYjsXmlFragment ||
        item instanceof CrdtYjsXmlText
    );
};

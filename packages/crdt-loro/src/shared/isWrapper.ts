import { CrdtLoroArray } from "../array/CrdtLoroArray";
import { CrdtLoroMap } from "../map/CrdtLoroMap";
import { CrdtLoroObject } from "../object/CrdtLoroObject";
import { CrdtLoroText } from "../text/CrdtLoroText";

export const isWrapper = (
    item: any,
): item is
    | CrdtLoroArray<any>
    | CrdtLoroMap<any>
    | CrdtLoroObject<any>
    | CrdtLoroText => {
    return (
        item instanceof CrdtLoroArray ||
        item instanceof CrdtLoroMap ||
        item instanceof CrdtLoroObject ||
        item instanceof CrdtLoroText
    );
};

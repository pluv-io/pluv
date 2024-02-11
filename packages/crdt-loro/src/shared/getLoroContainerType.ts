import { AbstractCrdtType } from "@pluv/crdt";
import { CrdtLoroArray } from "../array";
import { CrdtLoroMap } from "../map";
import { CrdtLoroObject } from "../object";
import { CrdtLoroText } from "../text";

export const getLoroContainerType = <T extends AbstractCrdtType<any, any>>(
    value: T,
): T extends CrdtLoroArray<any>
    ? "List"
    : T extends CrdtLoroMap<any> | CrdtLoroObject<any>
      ? "Map"
      : T extends CrdtLoroText
        ? "Text"
        : never => {
    if (value instanceof CrdtLoroArray) return "List" as any;
    if (value instanceof CrdtLoroMap) return "Map" as any;
    if (value instanceof CrdtLoroObject) return "Map" as any;
    if (value instanceof CrdtLoroText) return "Text" as any;

    throw new Error("This type is not yet supported");
};

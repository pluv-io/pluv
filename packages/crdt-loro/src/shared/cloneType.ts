import { AbstractCrdtType } from "@pluv/crdt";
import type { Container } from "loro-crdt";
import { LoroList, LoroMap, LoroText } from "loro-crdt";
import { CrdtLoroArray } from "../array";
import { CrdtLoroMap } from "../map";
import { CrdtLoroObject } from "../object";
import { CrdtLoroText } from "../text";

interface CloneArrayParams<T extends unknown> {
    source: CrdtLoroArray<T>;
    target: LoroList<T[]>;
}

interface CloneMapParams<T extends unknown> {
    source: CrdtLoroMap<T>;
    target: LoroMap<Record<string, T>>;
}

interface CloneObjectParams<T extends Record<string, any>> {
    source: CrdtLoroObject<T>;
    target: LoroMap<T>;
}

interface CloneTextParams {
    source: CrdtLoroText;
    target: LoroText;
}

type SourceType<TType extends Container> =
    TType extends LoroList<(infer I)[]>
        ? CrdtLoroArray<I>
        : TType extends LoroMap<infer I>
          ? CrdtLoroMap<I[keyof I]> | CrdtLoroObject<I>
          : TType extends LoroText
            ? CrdtLoroText
            : never;

export interface CloneTypeParams<TType extends Container> {
    source: SourceType<TType>;
    target: TType;
}

function cloneArray<T extends unknown>(params: CloneArrayParams<T>): void {
    const { source, target } = params;

    const items = source.initialValue;

    items.forEach((item, i) => {
        if (!(item instanceof AbstractCrdtType)) {
            target.insert(i, item);

            return;
        }

        if (item instanceof CrdtLoroArray) {
            const list = target.insertContainer(i, "List");

            item.value = list;
            cloneArray({ source: item, target: list });

            return;
        }

        if (item instanceof CrdtLoroMap) {
            const map = target.insertContainer(i, "Map");

            item.value = map;
            cloneMap({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroObject) {
            const map = target.insertContainer(i, "Map");

            item.value = map;
            cloneObject({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroText) {
            const text = target.insertContainer(i, "Text");

            item.value = text;
            cloneText({ source: item, target: text });

            return;
        }

        throw new Error("This type is not yet supported");
    });
}

function cloneMap<T extends unknown>(params: CloneMapParams<T>): void {
    const { source, target } = params;

    const items = source.initialValue;

    items.forEach(([key, item]) => {
        if (!(item instanceof AbstractCrdtType)) {
            target.set(key, item);

            return;
        }

        if (item instanceof CrdtLoroArray) {
            const list = target.setContainer(key, "List");

            item.value = list;
            cloneArray({ source: item, target: list });

            return;
        }

        if (item instanceof CrdtLoroMap) {
            const map = target.setContainer(key, "Map");

            item.value = map;
            cloneMap({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroObject) {
            const map = target.setContainer(key, "Map");

            item.value = map;
            cloneObject({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroText) {
            const text = target.setContainer(key, "Text");

            item.value = text;
            cloneText({ source: item, target: text });

            return;
        }

        throw new Error("This type is not yet supported");
    });
}

function cloneObject<T extends Record<string, any>>(
    params: CloneObjectParams<T>,
): void {
    const { source, target } = params;

    const items = source.initialValue;

    items.forEach(([key, item]) => {
        if (!(item instanceof AbstractCrdtType)) {
            target.set(key, item);

            return;
        }

        if (item instanceof CrdtLoroArray) {
            const list = target.setContainer(key, "List");

            item.value = list;
            cloneArray({ source: item, target: list });

            return;
        }

        if (item instanceof CrdtLoroMap) {
            const map = target.setContainer(key, "Map");

            item.value = map;
            cloneMap({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroObject) {
            const map = target.setContainer(key, "Map");

            item.value = map;
            cloneObject({ source: item, target: map });

            return;
        }

        if (item instanceof CrdtLoroText) {
            const text = target.setContainer(key, "Text");

            item.value = text;
            cloneText({ source: item, target: text });

            return;
        }

        throw new Error("This type is not yet supported");
    });
}

function cloneText(params: CloneTextParams): void {
    const { source, target } = params;

    source.value = target;
    source.insert(0, source.initalValue);
}

export const cloneType = <TType extends Container>(
    params: CloneTypeParams<TType>,
) => {
    const { source, target } = params;

    if (source instanceof CrdtLoroArray) {
        cloneArray({ source, target: target as LoroList });

        return;
    }

    if (source instanceof CrdtLoroMap) {
        cloneMap({ source, target: target as LoroMap });

        return;
    }

    if (source instanceof CrdtLoroObject) {
        cloneObject({ source, target: target as LoroMap });

        return;
    }

    if (source instanceof CrdtLoroText) {
        cloneText({ source, target: target as LoroText });

        return;
    }

    throw new Error("This type is not yet supported");
};

import { AbstractCrdtDocFactory } from "@pluv/crdt";
import { XmlFragment as YXmlFragment } from "yjs";
import { array } from "../array";
import { YjsArray } from "../array/YjsArray";
import { map } from "../map";
import { YjsMap } from "../map/YjsMap";
import { object } from "../object";
import { YjsObject } from "../object/YjsObject";
import { text } from "../text";
import { YjsText } from "../text/YjsText";
import type { YjsType } from "../types";
import { xmlElement } from "../xmlElement";
import { YjsXmlElement } from "../xmlElement/YjsXmlElement";
import { xmlFragment } from "../xmlFragment";
import { xmlText } from "../xmlText";
import { YjsXmlText } from "../xmlText/YjsXmlText";
import { CrdtYjsDoc } from "./CrdtYjsDoc";

export class CrdtYjsDocFactory<
    TStorage extends Record<string, YjsType<any, any>>,
> extends AbstractCrdtDocFactory<TStorage> {
    private _initialStorage: () => TStorage;

    constructor(initialStorage: () => TStorage = () => ({}) as TStorage) {
        super();

        this._initialStorage = initialStorage;
    }

    public getEmpty(): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>();
    }

    public getFactory(initialStorage?: (() => TStorage) | undefined): CrdtYjsDocFactory<TStorage> {
        return new CrdtYjsDocFactory<TStorage>(initialStorage ?? this._initialStorage);
    }

    public getFresh(): CrdtYjsDoc<TStorage> {
        const storage = this._initialStorage();

        return new CrdtYjsDoc<TStorage>(
            Object.entries(storage).reduce((acc, [key, node]) => {
                if (node instanceof YjsArray) {
                    return { ...acc, [key]: array() };
                }

                if (node instanceof YjsMap) {
                    return { ...acc, [key]: map() };
                }

                if (node instanceof YjsObject) {
                    return { ...acc, [key]: object() };
                }

                if (node instanceof YjsText) {
                    return { ...acc, [key]: text() };
                }

                if (node instanceof YjsXmlElement) {
                    return { ...acc, [key]: xmlElement(node.nodeName, []) };
                }

                if (node instanceof YXmlFragment) {
                    return { ...acc, [key]: xmlFragment([]) };
                }

                if (node instanceof YjsXmlText) {
                    return { ...acc, [key]: xmlText() };
                }

                return acc;
            }, {} as TStorage),
        );
    }

    public getInitialized(initialStorage?: () => TStorage): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

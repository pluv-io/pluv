import { AbstractCrdtDocFactory } from "@pluv/crdt";
import {
    Array as YArray,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
} from "yjs";
import type { YjsType } from "../types";
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
                if (node instanceof YArray) {
                    return { ...acc, [key]: new YArray() };
                }

                if (node instanceof YMap) {
                    return { ...acc, [key]: new YMap() };
                }

                if (node instanceof YText) {
                    return { ...acc, [key]: new YText() };
                }

                if (node instanceof YXmlElement) {
                    return { ...acc, [key]: new YXmlElement() };
                }

                if (node instanceof YXmlFragment) {
                    return { ...acc, [key]: new YXmlFragment() };
                }

                if (node instanceof YXmlText) {
                    return { ...acc, [key]: new YXmlText() };
                }

                return acc;
            }, {} as TStorage),
        );
    }

    public getInitialized(initialStorage?: () => TStorage): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

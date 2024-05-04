import type { AbstractCrdtType } from "@pluv/crdt";
import { AbstractCrdtDocFactory } from "@pluv/crdt";
import { CrdtYjsArray } from "../array";
import { CrdtYjsMap } from "../map";
import { CrdtYjsObject } from "../object";
import { CrdtYjsText } from "../text";
import { CrdtYjsXmlElement } from "../xmlElement";
import { CrdtYjsXmlFragment } from "../xmlFragment";
import { CrdtYjsXmlText } from "../xmlText";
import { CrdtYjsDoc } from "./CrdtYjsDoc";

export class CrdtYjsDocFactory<
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
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
                if (node instanceof CrdtYjsArray) {
                    return { ...acc, [key]: new CrdtYjsArray([]) };
                }

                if (node instanceof CrdtYjsMap) {
                    return { ...acc, [key]: new CrdtYjsMap([]) };
                }

                if (node instanceof CrdtYjsObject) {
                    return { ...acc, [key]: new CrdtYjsObject({}) };
                }

                if (node instanceof CrdtYjsText) {
                    return { ...acc, [key]: new CrdtYjsText("") };
                }

                if (node instanceof CrdtYjsXmlElement) {
                    return {
                        ...acc,
                        [key]: new CrdtYjsXmlElement(node.name, []),
                    };
                }

                if (node instanceof CrdtYjsXmlFragment) {
                    return { ...acc, [key]: new CrdtYjsXmlFragment([]) };
                }

                if (node instanceof CrdtYjsXmlText) {
                    return { ...acc, [key]: new CrdtYjsXmlText("") };
                }

                return acc;
            }, {} as TStorage),
        );
    }

    public getInitialized(initialStorage?: () => TStorage): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

import type { AbstractCrdtType } from "@pluv/crdt";
import { AbstractCrdtDocFactory } from "@pluv/crdt";
import { CrdtLoroArray } from "../array";
import { CrdtLoroMap } from "../map";
import { CrdtLoroObject } from "../object";
import { CrdtLoroText } from "../text";
import { CrdtLoroDoc } from "./CrdtLoroDoc";

export class CrdtLoroDocFactory<
    TStorage extends Record<string, AbstractCrdtType<any, any>>,
> extends AbstractCrdtDocFactory<TStorage> {
    private _initialStorage: () => TStorage;

    constructor(initialStorage: () => TStorage = () => ({}) as TStorage) {
        super();

        this._initialStorage = initialStorage;
    }

    public getEmpty(): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>();
    }

    public getFactory(initialStorage?: (() => TStorage) | undefined): CrdtLoroDocFactory<TStorage> {
        return new CrdtLoroDocFactory<TStorage>(initialStorage ?? this._initialStorage);
    }

    public getFresh(): CrdtLoroDoc<TStorage> {
        const storage = this._initialStorage();

        return new CrdtLoroDoc<TStorage>(
            Object.entries(storage).reduce((acc, [key, node]) => {
                if (node instanceof CrdtLoroArray) {
                    return { ...acc, [key]: new CrdtLoroArray([]) };
                }

                if (node instanceof CrdtLoroMap) {
                    return { ...acc, [key]: new CrdtLoroMap([]) };
                }

                if (node instanceof CrdtLoroObject) {
                    return { ...acc, [key]: new CrdtLoroObject({}) };
                }

                if (node instanceof CrdtLoroText) {
                    return { ...acc, [key]: new CrdtLoroText("") };
                }

                return acc;
            }, {} as TStorage),
        );
    }

    public getInitialized(initialStorage?: () => TStorage): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

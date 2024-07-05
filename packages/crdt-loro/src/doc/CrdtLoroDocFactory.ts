import { AbstractCrdtDocFactory } from "@pluv/crdt";
import { LoroList, LoroMap, LoroText } from "loro-crdt";
import type { LoroType } from "../types";
import { CrdtLoroDoc } from "./CrdtLoroDoc";

export class CrdtLoroDocFactory<
    TStorage extends Record<string, LoroType<any, any>>,
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
                if (node instanceof LoroList) {
                    return { ...acc, [key]: new LoroList() };
                }

                if (node instanceof LoroMap) {
                    return { ...acc, [key]: new LoroMap() };
                }

                if (node instanceof LoroText) {
                    return { ...acc, [key]: new LoroText() };
                }

                return acc;
            }, {} as TStorage),
        );
    }

    public getInitialized(initialStorage?: () => TStorage): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

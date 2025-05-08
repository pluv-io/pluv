import { AbstractCrdtDocFactory } from "@pluv/crdt";
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

    public getInitialized(initialStorage?: () => TStorage): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

import { AbstractCrdtDocFactory } from "@pluv/crdt";
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

    public getInitialized(initialStorage?: () => TStorage): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>(initialStorage?.() ?? this._initialStorage());
    }
}

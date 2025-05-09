import { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { LoroType } from "../types";
import { CrdtLoroDoc } from "./CrdtLoroDoc";
import type { LoroBuilder } from "./builder";

export class CrdtLoroDocFactory<
    TStorage extends Record<string, LoroType<any, any>>,
> extends AbstractCrdtDocFactory<TStorage> {
    private _initialStorage: (builder: LoroBuilder) => TStorage;

    constructor(initialStorage: (builder: LoroBuilder) => TStorage = () => ({}) as TStorage) {
        super();

        this._initialStorage = initialStorage;
    }

    public getEmpty(): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>();
    }

    public getFactory(
        initialStorage?: ((builder: LoroBuilder) => TStorage) | undefined,
    ): CrdtLoroDocFactory<TStorage> {
        return new CrdtLoroDocFactory<TStorage>(initialStorage ?? this._initialStorage);
    }

    public getInitialized(
        initialStorage?: (builder: LoroBuilder) => TStorage,
    ): CrdtLoroDoc<TStorage> {
        return new CrdtLoroDoc<TStorage>(initialStorage ?? this._initialStorage);
    }
}

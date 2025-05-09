import { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { YjsType } from "../types";
import { CrdtYjsDoc } from "./CrdtYjsDoc";
import type { YjsBuilder } from "./builder";

export class CrdtYjsDocFactory<
    TStorage extends Record<string, YjsType<any, any>>,
> extends AbstractCrdtDocFactory<TStorage> {
    private _initialStorage: (builder: YjsBuilder) => TStorage;

    constructor(initialStorage: (builder: YjsBuilder) => TStorage = () => ({}) as TStorage) {
        super();

        this._initialStorage = initialStorage;
    }

    public getEmpty(): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>();
    }

    public getFactory(
        initialStorage?: ((builder: YjsBuilder) => TStorage) | undefined,
    ): CrdtYjsDocFactory<TStorage> {
        return new CrdtYjsDocFactory<TStorage>(initialStorage ?? this._initialStorage);
    }

    public getInitialized(
        initialStorage?: (builder: YjsBuilder) => TStorage,
    ): CrdtYjsDoc<TStorage> {
        return new CrdtYjsDoc<TStorage>(initialStorage ?? this._initialStorage);
    }
}

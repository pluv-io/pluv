import type { CrdtDocFactory, CrdtDocLike, CrdtType } from "@pluv/types";

export abstract class AbstractCrdtDocFactory<
    TDoc extends any,
    TStorage extends Record<string, CrdtType<any, any>>,
> implements CrdtDocFactory<TDoc, TStorage>
{
    public _initialStorage: (builder: any) => TStorage;

    constructor(initialStorage: (builder: any) => TStorage) {
        this._initialStorage = initialStorage;
    }

    public abstract getEmpty(): CrdtDocLike<TDoc, TStorage>;
    public abstract getFactory(
        initialStorage?: (builder: any) => TStorage,
    ): AbstractCrdtDocFactory<TDoc, TStorage>;
    public abstract getInitialized(
        initialStorage?: (builder: any) => TStorage,
    ): CrdtDocLike<TDoc, TStorage>;

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        if (typeof updates === "string") return updates;
        if (!updates.length) return null;

        return this.getEmpty().batchApplyEncodedState({ updates }).getEncodedState();
    }
}

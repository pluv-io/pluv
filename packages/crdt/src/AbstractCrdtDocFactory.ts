import type { CrdtDocFactory, CrdtDocLike, CrdtType, Maybe } from "@pluv/types";

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

    public isEmpty(initialState: Maybe<string>): boolean {
        const doc = this.getEmpty().applyEncodedState({ update: initialState });
        const isEmpty = doc.isEmpty();
        doc.destroy();

        return isEmpty;
    }

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        if (typeof updates === "string") return updates;
        if (Array.isArray(updates) && !updates.length) return null;

        const applied = this.getEmpty().batchApplyEncodedState({ updates });

        if (applied.isEmpty()) {
            applied.destroy();
            return null;
        }

        const encodedState = applied.getEncodedState();
        applied.destroy();

        return encodedState;
    }
}

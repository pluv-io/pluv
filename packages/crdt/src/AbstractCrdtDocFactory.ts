import type { CrdtDocFactory, CrdtDocLike, Maybe } from "@pluv/types";

export abstract class AbstractCrdtDocFactory<
    TDoc extends any = any,
    TStorage extends Record<string, any> = Record<string, any>,
    TJson extends Record<string, any> = any,
    TSeed extends Record<string, any> = any,
> implements CrdtDocFactory<TDoc, TStorage, TJson, TSeed> {
    public abstract getEmpty(): CrdtDocLike<TDoc, TStorage, TJson>;
    public abstract getFactory(seed?: TSeed): AbstractCrdtDocFactory<TDoc, TStorage, TJson, TSeed>;
    public abstract getInitialized(seed?: TSeed): CrdtDocLike<TDoc, TStorage, TJson>;

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

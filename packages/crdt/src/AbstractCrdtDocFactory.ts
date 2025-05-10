import type { CrdtDocLike } from "@pluv/types";
import type { CrdtType } from "./types";

export abstract class AbstractCrdtDocFactory<TStorage extends Record<string, CrdtType<any, any>>> {
    public _initialStorage: (builder: any) => TStorage;

    constructor(initialStorage: (builder: any) => TStorage) {
        this._initialStorage = initialStorage;
    }

    public abstract getEmpty(): CrdtDocLike<TStorage>;
    public abstract getFactory(
        initialStorage?: (builder: any) => TStorage,
    ): AbstractCrdtDocFactory<TStorage>;
    public abstract getInitialized(
        initialStorage?: (builder: any) => TStorage,
    ): CrdtDocLike<TStorage>;

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        if (typeof updates === "string") return updates;
        if (!updates.length) return null;

        return this.getEmpty().batchApplyEncodedState({ updates }).getEncodedState();
    }
}

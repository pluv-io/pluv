import type { AbstractCrdtDoc } from "./AbstractCrdtDoc";
import type { CrdtType } from "./types";

export abstract class AbstractCrdtDocFactory<TStorage extends Record<string, CrdtType<any, any>>> {
    public abstract getEmpty(): AbstractCrdtDoc<TStorage>;
    public abstract getFactory(initialStorage?: () => TStorage): AbstractCrdtDocFactory<TStorage>;
    public abstract getInitialized(initialStorage?: () => TStorage): AbstractCrdtDoc<TStorage>;

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        if (typeof updates === "string") return updates;
        if (!updates.length) return null;

        return this.getEmpty().batchApplyEncodedState({ updates }).getEncodedState();
    }
}

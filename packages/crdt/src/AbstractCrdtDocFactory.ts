import type { CrdtDocLike } from "@pluv/types";
import type { CrdtType } from "./types";

export abstract class AbstractCrdtDocFactory<TStorage extends Record<string, CrdtType<any, any>>> {
    public abstract getEmpty(): CrdtDocLike<TStorage>;
    public abstract getFactory(initialStorage?: () => TStorage): AbstractCrdtDocFactory<TStorage>;
    public abstract getInitialized(initialStorage?: () => TStorage): CrdtDocLike<TStorage>;

    public resolveEncodedState(updates: string | string[] | readonly string[]): string | null {
        if (typeof updates === "string") return updates;
        if (!updates.length) return null;

        return this.getEmpty().batchApplyEncodedState({ updates }).getEncodedState();
    }
}

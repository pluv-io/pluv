import { CrdtDocLike } from "@pluv/types";
import type { CrdtType } from "./types";

export abstract class AbstractCrdtDocFactory<TStorage extends Record<string, CrdtType<any, any>>> {
    public abstract getEmpty(): CrdtDocLike<TStorage>;
    public abstract getFactory(initialStorage?: () => TStorage): AbstractCrdtDocFactory<TStorage>;
    public abstract getFresh(): CrdtDocLike<TStorage>;
    public abstract getInitialized(initialStorage?: () => TStorage): CrdtDocLike<TStorage>;
}

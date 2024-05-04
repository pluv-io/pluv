import { AbstractCrdtDoc } from "./AbstractCrdtDoc";
import type { AbstractCrdtType } from "./AbstractCrdtType";

export abstract class AbstractCrdtDocFactory<TStorage extends Record<string, AbstractCrdtType<any, any>>> {
    public abstract getEmpty(): AbstractCrdtDoc<TStorage>;
    public abstract getFactory(initialStorage?: () => TStorage): AbstractCrdtDocFactory<TStorage>;
    public abstract getFresh(): AbstractCrdtDoc<TStorage>;
    public abstract getInitialized(initialStorage?: () => TStorage): AbstractCrdtDoc<TStorage>;
}

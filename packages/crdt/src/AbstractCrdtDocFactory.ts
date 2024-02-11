import { AbstractCrdtDoc } from "./AbstractCrdtDoc";
import { AbstractCrdtType } from "./AbstractCrdtType";

export abstract class AbstractCrdtDocFactory<
    T extends Record<string, AbstractCrdtType<any, any>>,
> {
    public abstract getEmpty(): AbstractCrdtDoc<T>;
    public abstract getFresh(): AbstractCrdtDoc<T>;
    public abstract getInitialized(): AbstractCrdtDoc<T>;
}

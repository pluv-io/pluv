import { AbstractCrdtType } from "./AbstractCrdtType";

export interface AbstractCrdtArrayDeleteParams {
    index: number;
    length?: number;
}

export interface AbstractCrdtArrayInsertParams<T extends unknown> {
    index: number;
    items: T[];
}

export abstract class AbstractCrdtArray<
    T extends unknown,
> extends AbstractCrdtType<T[]> {
    public abstract readonly length: number;

    public abstract delete(params: AbstractCrdtArrayDeleteParams): number;
    public abstract insert(params: AbstractCrdtArrayInsertParams<T>): number;
    public abstract pop(): T | undefined;
    public abstract push(...items: T[]): number;
    public abstract unshift(...items: T[]): number;
}

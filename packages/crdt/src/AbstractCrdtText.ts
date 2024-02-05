import { AbstractCrdtType } from "./AbstractCrdtType";

export interface AbstractCrdtTextDeleteParams {
    index: number;
    length?: number;
}

export interface AbstractCrdtTextInsertParams {
    index: number;
    text: string;
}

export abstract class AbstractCrdtText extends AbstractCrdtType<string> {
    public abstract readonly length: number;

    public abstract delete(params: AbstractCrdtTextDeleteParams): number;
    public abstract insert(params: AbstractCrdtTextInsertParams): number;
}

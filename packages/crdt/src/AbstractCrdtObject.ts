import { AbstractCrdtType } from "./AbstractCrdtType";

export abstract class AbstractCrdtObject<
    T extends Record<string, any>,
> extends AbstractCrdtType<T> {
    public abstract size: number;

    public abstract get<P extends keyof T>(prop: P): T[P] | undefined;
    public abstract set<P extends keyof T>(prop: P, value: T[P]): this;
}

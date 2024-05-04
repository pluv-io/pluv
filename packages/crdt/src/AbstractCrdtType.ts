import type { InferCrdtStorageJson } from "./types";

export abstract class AbstractCrdtType<TValue extends unknown, TJson extends unknown> {
    public abstract value: TValue;

    public abstract toJson(): InferCrdtStorageJson<TJson>;
}

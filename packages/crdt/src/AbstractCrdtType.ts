import { InferCrdtStorageJson } from "./types";

export abstract class AbstractCrdtType<T extends unknown> {
    public abstract toJson(): InferCrdtStorageJson<T>;
}

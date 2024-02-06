import { AbstractCrdtType } from "./AbstractCrdtType";
import type { InferCrdtStorageJson } from "./types";

export interface DocApplyEncodedStateParams {
    origin?: string;
    update?: string | Uint8Array;
}

export interface DocSubscribeCallbackParams<
    T extends Record<string, AbstractCrdtType<any, any>>,
> {
    doc: AbstractCrdtDoc<T>;
    local: boolean;
    origin?: string;
    update: string;
}

export abstract class AbstractCrdtDoc<
    T extends Record<string, AbstractCrdtType<any, any>>,
> {
    public abstract applyEncodedState(params: DocApplyEncodedStateParams): this;
    public abstract batchApplyEncodedState(
        updates: readonly (
            | DocApplyEncodedStateParams
            | string
            | null
            | undefined
        )[],
    ): this;
    public abstract canRedo(): boolean;
    public abstract canUndo(): boolean;
    public abstract destroy(): void;
    public abstract fresh(): AbstractCrdtDoc<T>;
    public abstract get(key?: undefined): T;
    public abstract get<TKey extends keyof T>(key: TKey): T[TKey];
    public abstract getEncodedState(): string;
    public abstract isEmpty(): boolean;
    public abstract redo(): this;
    public abstract subscribe(
        listener: (params: DocSubscribeCallbackParams<T>) => void,
    ): () => void;
    public abstract toJson(): InferCrdtStorageJson<T>;
    public abstract track(): this;
    public abstract transact(fn: () => void, origin?: string): this;
    public abstract undo(): this;
}

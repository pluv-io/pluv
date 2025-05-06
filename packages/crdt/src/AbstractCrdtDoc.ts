import type { Maybe } from "@pluv/types";
import type { CrdtType, InferCrdtJson } from "./types";

export interface DocApplyEncodedStateParams {
    origin?: string;
    update?: Maybe<string | Uint8Array>;
}

export interface DocBatchApplyEncodedStateParams {
    origin?: string;
    updates?: Maybe<readonly Maybe<string | Uint8Array>[]>;
}

export interface DocSubscribeCallbackParams<T extends Record<string, CrdtType<any, any>>> {
    doc: AbstractCrdtDoc<T>;
    local: boolean;
    origin?: string | null;
    update: string;
}

export abstract class AbstractCrdtDoc<T extends Record<string, CrdtType<any, any>>> {
    public abstract applyEncodedState(params: DocApplyEncodedStateParams): this;
    public abstract batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this;
    public abstract canRedo(): boolean;
    public abstract canUndo(): boolean;
    public abstract destroy(): void;
    public abstract get(key?: undefined): T;
    public abstract get<TKey extends keyof T>(key: TKey): T[TKey];
    public abstract getEncodedState(): string;
    public abstract isEmpty(): boolean;
    public abstract redo(): this;
    public abstract subscribe(
        listener: (params: DocSubscribeCallbackParams<T>) => void,
    ): () => void;
    public abstract toJson(): InferCrdtJson<T>;
    public abstract toJson<TKey extends keyof T>(type: TKey): InferCrdtJson<T[TKey]>;
    public abstract track(): this;
    public abstract transact(fn: () => void, origin?: string): this;
    public abstract undo(): this;
}

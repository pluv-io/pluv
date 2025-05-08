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

export interface DocSubscribeCallbackParams<TStorage extends Record<string, CrdtType<any, any>>> {
    doc: AbstractCrdtDoc<TStorage>;
    local: boolean;
    origin?: string | null;
    update: string;
}

export abstract class AbstractCrdtDoc<TStorage extends Record<string, CrdtType<any, any>>> {
    public abstract applyEncodedState(params: DocApplyEncodedStateParams): this;
    public abstract batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this;
    public abstract canRedo(): boolean;
    public abstract canUndo(): boolean;
    public abstract destroy(): void;
    public abstract get(key?: undefined): TStorage;
    public abstract get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    public abstract getEncodedState(): string;
    public abstract isEmpty(): boolean;
    public abstract rebuildStorage(reference: TStorage): this;
    public abstract redo(): this;
    public abstract subscribe(
        listener: (params: DocSubscribeCallbackParams<TStorage>) => void,
    ): () => void;
    public abstract toJson(): InferCrdtJson<TStorage>;
    public abstract toJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]>;
    public abstract track(): this;
    public abstract transact(fn: () => void, origin?: string): this;
    public abstract undo(): this;
}

import type { Json, Maybe } from "../general";

export type CrdtType<TValue extends unknown, TJson extends unknown = any> = Omit<
    TValue,
    "__pluvType"
> & {
    __pluvType: () => TJson;
};

export type InferCrdtJson<T extends unknown> =
    T extends CrdtType<any, infer IJson>
        ? InferCrdtJson<IJson>
        : T extends Record<string, any>
          ? { [P in keyof T]: InferCrdtJson<T[P]> }
          : T extends (infer IJson)[]
            ? InferCrdtJson<IJson>[]
            : T extends readonly (infer IJson)[]
              ? readonly InferCrdtJson<IJson>[]
              : T extends Json
                ? T
                : string;

export interface DocApplyEncodedStateParams {
    origin?: string;
    update?: Maybe<string | Uint8Array>;
}

export interface DocBatchApplyEncodedStateParams {
    origin?: string;
    updates?: Maybe<readonly Maybe<string | Uint8Array>[]>;
}

export interface DocSubscribeCallbackParams<T extends Record<string, CrdtType<any, any>>> {
    doc: CrdtDocLike<T>;
    local: boolean;
    origin?: string | null;
    update: string;
}

export interface CrdtDocLike<T extends Record<string, CrdtType<any, any>>> {
    applyEncodedState(params: DocApplyEncodedStateParams): this;
    batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this;
    canRedo(): boolean;
    canUndo(): boolean;
    destroy(): void;
    get(key?: undefined): T;
    get<TKey extends keyof T>(key: TKey): T[TKey];
    getEncodedState(): string;
    isEmpty(): boolean;
    redo(): this;
    subscribe(listener: (params: DocSubscribeCallbackParams<T>) => void): () => void;
    toJson(): InferCrdtJson<T>;
    toJson<TKey extends keyof T>(type: TKey): InferCrdtJson<T[TKey]>;
    track(): this;
    transact(fn: () => void, origin?: string): this;
    undo(): this;
}

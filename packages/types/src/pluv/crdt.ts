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

export interface DocSubscribeCallbackParams<
    TDoc extends any,
    TStorage extends Record<string, CrdtType<any, any>>,
> {
    doc: CrdtDocLike<TDoc, TStorage>;
    local: boolean;
    origin?: string | null;
    update: string;
}

export interface CrdtDocLike<
    TDoc extends any,
    TStorage extends Record<string, CrdtType<any, any>>,
> {
    value: TDoc;

    applyEncodedState(params: DocApplyEncodedStateParams): this;
    batchApplyEncodedState(params: DocBatchApplyEncodedStateParams): this;
    canRedo(): boolean;
    canUndo(): boolean;
    destroy(): void;
    get(key?: undefined): TStorage;
    get<TKey extends keyof TStorage>(key: TKey): TStorage[TKey];
    getEncodedState(): string;
    isEmpty(): boolean;
    rebuildStorage(reference: TStorage): this;
    redo(): this;
    subscribe(listener: (params: DocSubscribeCallbackParams<TDoc, TStorage>) => void): () => void;
    toJson(): InferCrdtJson<TStorage>;
    toJson<TKey extends keyof TStorage>(type: TKey): InferCrdtJson<TStorage[TKey]>;
    track(): this;
    transact(fn: () => void, origin?: string): this;
    undo(): this;
}

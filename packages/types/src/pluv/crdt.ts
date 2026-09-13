import type { Maybe } from "../general";

export interface CrdtDocFactory<
    TDoc extends any = any,
    TStorage extends Record<string, any> = Record<string, any>,
    TJson extends Record<string, any> = any,
    TSeed extends Record<string, any> = any,
> {
    getEmpty(): CrdtDocLike<TDoc, TStorage, TJson>;
    getFactory(seed?: TSeed): CrdtDocFactory<TDoc, TStorage, TJson, TSeed>;
    getInitialized(seed?: TSeed): CrdtDocLike<TDoc, TStorage, TJson>;
    isEmpty(initialStorage: Maybe<string>): boolean;
}

export type CrdtLibraryKind = "loro" | "noop" | "yjs";

export interface CrdtLibraryType<
    TDoc extends CrdtDocFactory<any, any, any, any> = CrdtDocFactory<any, any>,
> {
    doc: (value?: any) => TDoc;
    kind: CrdtLibraryKind;
}

/** True when `TCrdt` is a real CRDT library (`yjs` / `loro`), not the noop default. */
export type HasCrdtLibrary<TCrdt> = [TCrdt] extends [never]
    ? false
    : 0 extends 1 & TCrdt
      ? false
      : [TCrdt] extends [{ kind: "loro" | "yjs" }]
        ? true
        : false;

export interface DocApplyEncodedStateParams {
    origin?: string;
    update?: Maybe<string | Uint8Array>;
}

export interface DocBatchApplyEncodedStateParams {
    origin?: string;
    updates?: Maybe<readonly Maybe<string | Uint8Array>[]>;
}

export interface DocSubscribeCallbackParams<
    TDoc extends any = any,
    TStorage extends Record<string, any> = Record<string, any>,
    TJson extends Record<string, any> = any,
> {
    doc: CrdtDocLike<TDoc, TStorage, TJson>;
    local: boolean;
    origin?: string | null;
    update: string;
}

export interface CrdtDocLike<
    TDoc extends any = any,
    TStorage extends Record<string, any> = Record<string, any>,
    TJson extends Record<string, any> = any,
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
    /**
     * @description Whether the document has ever received an operation. Not the inverse of
     * `isEmpty()`: a document whose content was deleted is still dirty.
     */
    isDirty(): boolean;
    isEmpty(): boolean;
    rebuildStorage(reference?: TStorage): this;
    redo(): this;
    subscribe(
        listener: (params: DocSubscribeCallbackParams<TDoc, TStorage, TJson>) => void,
    ): () => void;
    toJson(): TJson;
    toJson<TKey extends keyof TJson>(type: TKey): TJson[TKey];
    track(): this;
    transact(fn: () => void, origin?: string): this;
    undo(): this;
}

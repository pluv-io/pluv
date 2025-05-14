import type { AbstractCrdtDocFactory } from "./AbstractCrdtDocFactory";

export type InferDoc<TFactory extends AbstractCrdtDocFactory<any, any>> =
    InferDocLike<TFactory>["value"];

export type InferDocLike<TFactory extends AbstractCrdtDocFactory<any, any>> = ReturnType<
    TFactory["getInitialized"]
>;

export type InferInitialStorageFn<TFactory extends AbstractCrdtDocFactory<any, any>> =
    TFactory["_initialStorage"];

export type InferStorage<TFactory extends AbstractCrdtDocFactory<any, any>> = ReturnType<
    InferInitialStorageFn<TFactory>
>;

export type InferBuilder<TFactory extends AbstractCrdtDocFactory<any, any>> = Parameters<
    InferInitialStorageFn<TFactory>
>[0];

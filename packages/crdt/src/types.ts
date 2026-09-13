import type { AbstractCrdtDocFactory } from "./AbstractCrdtDocFactory";
import type {
    InferJson as InferSchemaJson,
    InferSeed as InferSchemaSeed,
    InferStorage as InferSchemaStorage,
} from "./schema";

export type { CrdtLibraryKind, CrdtLibraryType, HasCrdtLibrary } from "@pluv/types";

export type InferDoc<TFactory extends AbstractCrdtDocFactory<any, any, any, any>> =
    InferDocLike<TFactory>["value"];

export type InferDocLike<TFactory extends AbstractCrdtDocFactory<any, any, any, any>> = ReturnType<
    TFactory["getInitialized"]
>;

export type InferStorage<T> =
    T extends AbstractCrdtDocFactory<any, infer TStorage, any, any>
        ? TStorage
        : InferSchemaStorage<T>;

export type InferJson<T> =
    T extends AbstractCrdtDocFactory<any, any, infer TJson, any> ? TJson : InferSchemaJson<T>;

export type InferSeed<T> =
    T extends AbstractCrdtDocFactory<any, any, any, infer TSeed> ? TSeed : InferSchemaSeed<T>;

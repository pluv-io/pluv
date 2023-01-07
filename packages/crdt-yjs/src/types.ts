import type {
    AbstractType,
    Array as YArray,
    Map as YMap,
    Text as YText,
} from "yjs";
import type { YjsDoc } from "./doc";
import type { unstable__YObject } from "./object";

export type InferYjsDocJson<TDoc extends YjsDoc<any>> = TDoc extends YjsDoc<
    infer ITypes
>
    ? { [P in keyof ITypes]: InferYjsSharedTypeJson<ITypes[P]> }
    : never;

export type InferYjsDocSharedType<
    TDoc extends YjsDoc<any>,
    TKey extends keyof InferYjsDocSharedTypes<TDoc> = keyof InferYjsDocSharedTypes<TDoc>
> = InferYjsDocSharedTypes<TDoc>[TKey];

export type InferYjsDocSharedTypeJson<
    TDoc extends YjsDoc<any>,
    TKey extends keyof InferYjsDocSharedTypes<TDoc> = keyof InferYjsDocSharedTypes<TDoc>
> = InferYjsSharedTypeJson<InferYjsDocSharedTypes<TDoc>[TKey]>;

export type InferYjsDocSharedTypes<TDoc extends YjsDoc<any>> =
    TDoc extends YjsDoc<infer ITypes> ? ITypes : never;

export type InferYjsSharedTypeJson<TShared extends unknown> =
    TShared extends AbstractType<any>
        ? TShared extends YArray<infer IItem>
            ? readonly InferYjsSharedTypeJson<IItem>[]
            : TShared extends unstable__YObject<infer IObject>
            ? { [P in keyof IObject]: InferYjsSharedTypeJson<IObject[P]> }
            : TShared extends YMap<infer IItem>
            ? Record<string, InferYjsSharedTypeJson<IItem>>
            : TShared extends YText
            ? string
            : never
        : TShared;

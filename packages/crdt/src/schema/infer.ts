import type {
    AnySchemaNode,
    InferNodeJson,
    InferNodeSeed,
    InferNodeStorage,
    SchemaNode,
} from "./node";
import { isOptionalNode } from "./node";

type OptionalKeys<T extends Record<string, AnySchemaNode>> = {
    [K in keyof T]: T[K] extends { kind: "optional" } ? K : never;
}[keyof T];

type RequiredKeys<T extends Record<string, AnySchemaNode>> = Exclude<keyof T, OptionalKeys<T>>;

type InferOptionalInnerJson<T> = T extends { kind: "optional"; inner: infer I }
    ? InferNodeJson<I>
    : InferNodeJson<T>;

type InferOptionalInnerSeed<T> = T extends { kind: "optional"; inner: infer I }
    ? InferNodeSeed<I>
    : InferNodeSeed<T>;

export type InferObjectJson<T extends Record<string, AnySchemaNode>> = {
    [K in RequiredKeys<T>]: InferNodeJson<T[K]>;
} & {
    [K in OptionalKeys<T>]?: InferOptionalInnerJson<T[K]>;
};

export type InferObjectSeed<T extends Record<string, AnySchemaNode>> = {
    [K in RequiredKeys<T>]: InferNodeSeed<T[K]>;
} & {
    [K in OptionalKeys<T>]?: InferOptionalInnerSeed<T[K]>;
};

export type InferObjectStorage<T extends Record<string, AnySchemaNode>> = InferObjectJson<T>;

type UnionStorage<T extends readonly AnySchemaNode[]> = InferNodeStorage<T[number]>;
type UnionJson<T extends readonly AnySchemaNode[]> = InferNodeJson<T[number]>;
type UnionSeed<T extends readonly AnySchemaNode[]> = InferNodeSeed<T[number]>;

type IntersectionJson<T extends readonly AnySchemaNode[]> = T extends readonly [
    infer TFirst extends AnySchemaNode,
    ...infer TRest extends readonly AnySchemaNode[],
]
    ? InferNodeJson<TFirst> & IntersectionJson<TRest>
    : unknown;

type IntersectionSeed<T extends readonly AnySchemaNode[]> = T extends readonly [
    infer TFirst extends AnySchemaNode,
    ...infer TRest extends readonly AnySchemaNode[],
]
    ? InferNodeSeed<TFirst> & IntersectionSeed<TRest>
    : unknown;

export type StringNode = SchemaNode<"string", string, string, string>;
export type NumberNode = SchemaNode<"number", number, number, number>;
export type BooleanNode = SchemaNode<"boolean", boolean, boolean, boolean>;
export type NullNode = SchemaNode<"null", null, null, null>;
export type LiteralNode<T extends string | number | boolean> = SchemaNode<"literal", T, T, T>;
export type EnumNode<T extends string> = SchemaNode<"enum", T, T, T>;
export type ArrayNode<TItem extends AnySchemaNode> = SchemaNode<
    "array",
    InferNodeJson<TItem>[],
    InferNodeJson<TItem>[],
    InferNodeSeed<TItem>[]
>;
export type ObjectNode<TShape extends Record<string, AnySchemaNode>> = SchemaNode<
    "object",
    InferObjectStorage<TShape>,
    InferObjectJson<TShape>,
    InferObjectSeed<TShape>
> & { readonly shape: TShape };
export type RecordNode<TValue extends AnySchemaNode> = SchemaNode<
    "record",
    Record<string, InferNodeJson<TValue>>,
    Record<string, InferNodeJson<TValue>>,
    Record<string, InferNodeSeed<TValue>>
>;
export type UnionNode<TOptions extends readonly AnySchemaNode[]> = SchemaNode<
    "union",
    UnionStorage<TOptions>,
    UnionJson<TOptions>,
    UnionSeed<TOptions>
> & { readonly options: TOptions };
export type IntersectionNode<TOptions extends readonly AnySchemaNode[]> = SchemaNode<
    "intersection",
    IntersectionJson<TOptions>,
    IntersectionJson<TOptions>,
    IntersectionSeed<TOptions>
> & { readonly options: TOptions };
export type DiscriminatedUnionNode<
    TKey extends string,
    TOptions extends readonly AnySchemaNode[],
> = SchemaNode<
    "discriminatedUnion",
    UnionStorage<TOptions>,
    UnionJson<TOptions>,
    UnionSeed<TOptions>
> & {
    readonly discriminator: TKey;
    readonly options: TOptions;
};
export type OptionalNode<TInner extends AnySchemaNode> = SchemaNode<
    "optional",
    InferNodeStorage<TInner> | undefined,
    InferNodeJson<TInner> | undefined,
    InferNodeSeed<TInner> | undefined
> & { readonly inner: TInner };

export type SchemaShape = Record<string, AnySchemaNode>;

export type InferShapeStorage<TShape extends SchemaShape> = {
    [K in keyof TShape]: InferNodeStorage<TShape[K]>;
};

export type InferShapeJson<TShape extends SchemaShape> = {
    [K in keyof TShape]: InferNodeJson<TShape[K]>;
};

export type InferShapeSeed<TShape extends SchemaShape> = {
    [K in keyof TShape as InferNodeSeed<TShape[K]> extends never ? never : K]?: InferNodeSeed<
        TShape[K]
    >;
};

export type InferStorage<T> = T extends { readonly shape: infer TShape extends SchemaShape }
    ? InferShapeStorage<TShape>
    : T extends SchemaNode<string, infer TStorage, unknown, unknown>
      ? TStorage
      : never;

export type InferJson<T> = T extends { readonly shape: infer TShape extends SchemaShape }
    ? InferShapeJson<TShape>
    : T extends SchemaNode<string, unknown, infer TJson, unknown>
      ? TJson
      : never;

export type InferSeed<T> = T extends { readonly shape: infer TShape extends SchemaShape }
    ? InferShapeSeed<TShape>
    : T extends SchemaNode<string, unknown, unknown, infer TSeed>
      ? TSeed
      : never;

export const isOptionalSchemaNode = isOptionalNode;

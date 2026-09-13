import { CrdtSchemaError } from "./error";
import { isCrdtKind, isJsonKind } from "./kinds";

declare const SchemaStorage: unique symbol;
declare const SchemaJson: unique symbol;
declare const SchemaSeed: unique symbol;

export type SchemaAst = {
    kind: string;
    [key: string]: unknown;
};

export interface SchemaNode<
    TKind extends string = string,
    TStorage = unknown,
    TJson = unknown,
    TSeed = unknown,
> {
    readonly kind: TKind;
    readonly [SchemaStorage]?: TStorage;
    readonly [SchemaJson]?: TJson;
    readonly [SchemaSeed]?: TSeed;
    toJSON(): SchemaAst;
}

export type InferNodeStorage<T> =
    T extends SchemaNode<string, infer TStorage, unknown, unknown> ? TStorage : never;

export type InferNodeJson<T> =
    T extends SchemaNode<string, unknown, infer TJson, unknown> ? TJson : never;

export type InferNodeSeed<T> =
    T extends SchemaNode<string, unknown, unknown, infer TSeed> ? TSeed : never;

export type AnySchemaNode = SchemaNode<string, any, any, any>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isSchemaNode = (value: unknown): value is AnySchemaNode => {
    return isRecord(value) && typeof value.kind === "string" && typeof value.toJSON === "function";
};

export const toAst = (value: unknown): unknown => {
    if (isSchemaNode(value)) return value.toJSON();
    if (Array.isArray(value)) return value.map(toAst);
    if (isRecord(value)) {
        return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, nested]) => {
            acc[key] = toAst(nested);
            return acc;
        }, {});
    }

    return value;
};

export const createSchemaNode = <
    TKind extends string,
    TStorage,
    TJson,
    TSeed,
    TExtras extends Record<string, unknown>,
>(
    kind: TKind,
    extras: TExtras,
): SchemaNode<TKind, TStorage, TJson, TSeed> & TExtras => {
    const node = {
        kind,
        ...extras,
        toJSON(): SchemaAst {
            const json: SchemaAst = { kind };

            Object.entries(extras).forEach(([key, value]) => {
                json[key] = toAst(value);
            });

            return json;
        },
    };

    return node as SchemaNode<TKind, TStorage, TJson, TSeed> & TExtras;
};

export const isJsonSchema = (node: AnySchemaNode): boolean => {
    if (node.kind === "optional") {
        const inner = (node as AnySchemaNode & { inner: AnySchemaNode }).inner;
        return isJsonSchema(inner);
    }

    if (
        node.kind === "union" ||
        node.kind === "intersection" ||
        node.kind === "discriminatedUnion"
    ) {
        const options = (node as AnySchemaNode & { options: readonly AnySchemaNode[] }).options;
        return options.every(isJsonSchema);
    }

    if (node.kind === "array") {
        return isJsonSchema((node as AnySchemaNode & { item: AnySchemaNode }).item);
    }

    if (node.kind === "record") {
        return isJsonSchema((node as AnySchemaNode & { value: AnySchemaNode }).value);
    }

    if (node.kind === "object") {
        const shape = (node as AnySchemaNode & { shape: Record<string, AnySchemaNode> }).shape;
        return Object.values(shape).every(isJsonSchema);
    }

    return isJsonKind(node.kind) && !isCrdtKind(node.kind);
};

export const isOptionalNode = (
    node: AnySchemaNode,
): node is AnySchemaNode & { kind: "optional"; inner: AnySchemaNode } => {
    return node.kind === "optional";
};

export const unwrapOptional = (node: AnySchemaNode): AnySchemaNode => {
    return isOptionalNode(node) ? node.inner : node;
};

export const assertJsonSchema = (node: AnySchemaNode, context: string): void => {
    if (!isJsonSchema(node)) {
        throw new CrdtSchemaError(`${context} must be a JSON schema`);
    }
};

export const assertNotOptional = (node: AnySchemaNode, context: string): void => {
    if (isOptionalNode(node)) {
        throw new CrdtSchemaError(
            `${context} cannot be optional; s.$optional is only valid on s.object fields`,
        );
    }
};

export const assertSchemaNode = (
    value: unknown,
    context: string,
): asserts value is AnySchemaNode => {
    if (!isSchemaNode(value)) {
        throw new CrdtSchemaError(`${context} must be a schema node`);
    }
};

import {
    CrdtSchemaError,
    createSchemaNode,
    isSchemaNode,
    isYjsCrdtKind,
    isLoroCrdtKind,
    type AnySchemaNode,
    type InferShapeJson,
    type InferShapeSeed,
    type InferShapeStorage,
    type SchemaAst,
} from "@pluv/crdt";
import { fromJSON as fromJsonNode } from "./fromJSON";

const LORO_SCHEMA_BRAND: unique symbol = Symbol("pluv.loro.schema");

export type LoroSchema<
    TShape extends Record<string, AnySchemaNode> = Record<string, AnySchemaNode>,
> = {
    readonly kind: "loro.doc";
    readonly shape: TShape;
    readonly [LORO_SCHEMA_BRAND]: true;
    toJSON(): { kind: "loro.doc"; shape: Record<string, unknown> };
};

export type InferLoroStorage<TSchema extends LoroSchema<any>> = InferShapeStorage<TSchema["shape"]>;
export type InferLoroJson<TSchema extends LoroSchema<any>> = InferShapeJson<TSchema["shape"]>;
export type InferLoroSeed<TSchema extends LoroSchema<any>> = InferShapeSeed<TSchema["shape"]>;

export const isLoroSchema = (value: unknown): value is LoroSchema => {
    return (
        typeof value === "object" &&
        value !== null &&
        (value as LoroSchema).kind === "loro.doc" &&
        (value as LoroSchema)[LORO_SCHEMA_BRAND] === true
    );
};

export const schema = <TShape extends Record<string, AnySchemaNode>>(
    shape: TShape,
): LoroSchema<TShape> => {
    Object.entries(shape).forEach(([key, node]) => {
        if (!isSchemaNode(node)) {
            throw new CrdtSchemaError(`loro.schema field "${key}" must be a schema node`);
        }

        if (isYjsCrdtKind(node.kind)) {
            throw new CrdtSchemaError(`loro.schema field "${key}" cannot be a Yjs node`);
        }

        if (!isLoroCrdtKind(node.kind)) {
            throw new CrdtSchemaError(`loro.schema field "${key}" must be a Loro CRDT node`);
        }
    });

    const node = createSchemaNode("loro.doc", { shape });

    return Object.assign(node, {
        [LORO_SCHEMA_BRAND]: true as const,
    }) as unknown as LoroSchema<TShape>;
};

schema.fromJSON = (ast: SchemaAst): LoroSchema => {
    if (ast.kind !== "loro.doc") {
        throw new CrdtSchemaError(`Expected kind "loro.doc", received "${ast.kind}"`);
    }

    const shapeAst = (ast.shape ?? {}) as Record<string, SchemaAst>;
    const shape = Object.entries(shapeAst).reduce<Record<string, AnySchemaNode>>(
        (acc, [key, value]) => {
            acc[key] = fromJsonNode(value);
            return acc;
        },
        {},
    );

    return schema(shape);
};

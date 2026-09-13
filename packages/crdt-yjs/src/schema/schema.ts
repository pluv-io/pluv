import {
    CrdtSchemaError,
    createSchemaNode,
    isLoroCrdtKind,
    isSchemaNode,
    isYjsCrdtKind,
    type AnySchemaNode,
    type InferShapeJson,
    type InferShapeSeed,
    type InferShapeStorage,
    type SchemaAst,
} from "@pluv/crdt";
import { fromJSON as fromJsonNode } from "./fromJSON";

const YJS_SCHEMA_BRAND = Symbol.for("pluv.yjs.schema");

export type YjsSchema<
    TShape extends Record<string, AnySchemaNode> = Record<string, AnySchemaNode>,
> = {
    readonly kind: "y.doc";
    readonly shape: TShape;
    readonly [typeof YJS_SCHEMA_BRAND]: true;
    toJSON(): { kind: "y.doc"; shape: Record<string, unknown> };
};

export type InferYjsStorage<TSchema extends YjsSchema<any>> = InferShapeStorage<TSchema["shape"]>;
export type InferYjsJson<TSchema extends YjsSchema<any>> = InferShapeJson<TSchema["shape"]>;
export type InferYjsSeed<TSchema extends YjsSchema<any>> = InferShapeSeed<TSchema["shape"]>;

export const isYjsSchema = (value: unknown): value is YjsSchema => {
    return (
        typeof value === "object" &&
        value !== null &&
        (value as YjsSchema).kind === "y.doc" &&
        (value as YjsSchema)[YJS_SCHEMA_BRAND] === true
    );
};

export const schema = <TShape extends Record<string, AnySchemaNode>>(
    shape: TShape,
): YjsSchema<TShape> => {
    Object.entries(shape).forEach(([key, node]) => {
        if (!isSchemaNode(node)) {
            throw new CrdtSchemaError(`yjs.schema field "${key}" must be a schema node`);
        }

        if (isLoroCrdtKind(node.kind)) {
            throw new CrdtSchemaError(`yjs.schema field "${key}" cannot be a Loro node`);
        }

        if (!isYjsCrdtKind(node.kind)) {
            throw new CrdtSchemaError(`yjs.schema field "${key}" must be a Yjs CRDT node`);
        }
    });

    const node = createSchemaNode("y.doc", { shape });

    return Object.assign(node, { [YJS_SCHEMA_BRAND]: true as const }) as YjsSchema<TShape>;
};

schema.fromJSON = (ast: SchemaAst): YjsSchema => {
    if (ast.kind !== "y.doc") {
        throw new CrdtSchemaError(`Expected kind "y.doc", received "${ast.kind}"`);
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

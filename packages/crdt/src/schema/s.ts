import { CrdtSchemaError } from "./error";
import type {
    ArrayNode,
    DiscriminatedUnionNode,
    EnumNode,
    IntersectionNode,
    LiteralNode,
    ObjectNode,
    OptionalNode,
    RecordNode,
    UnionNode,
} from "./infer";
import type { AnySchemaNode, SchemaAst, SchemaNode } from "./node";
import {
    assertJsonSchema,
    assertNotOptional,
    createSchemaNode,
    isOptionalNode,
    isSchemaNode,
    unwrapOptional,
} from "./node";

const flattenObjectShape = (
    node: AnySchemaNode,
    context: string,
): Record<string, AnySchemaNode> => {
    if (node.kind === "object") {
        return (node as ObjectNode<Record<string, AnySchemaNode>>).shape;
    }

    if (node.kind === "intersection") {
        const options = (node as IntersectionNode<readonly AnySchemaNode[]>).options;

        return options.reduce<Record<string, AnySchemaNode>>((acc, option) => {
            const shape = flattenObjectShape(option, context);
            Object.entries(shape).forEach(([key, field]) => {
                if (
                    key in acc &&
                    JSON.stringify(acc[key]!.toJSON()) !== JSON.stringify(field.toJSON())
                ) {
                    throw new CrdtSchemaError(`${context} has conflicting types for key "${key}"`);
                }
                acc[key] = field;
            });
            return acc;
        }, {});
    }

    throw new CrdtSchemaError(`${context} must be an s.object or s.$intersection of objects`);
};

const assertObjectLike = (node: AnySchemaNode, context: string): void => {
    flattenObjectShape(node, context);
};

const getDiscriminatorField = (node: AnySchemaNode, key: string): AnySchemaNode | null => {
    const shape = flattenObjectShape(node, `s.$discriminatedUnion branch`);
    const field = shape[key];

    if (!field) return null;

    const inner = unwrapOptional(field);

    if (inner.kind === "literal") return inner;
    if (inner.kind === "enum") {
        const values = (inner as EnumNode<string> & { values: readonly string[] }).values;
        if (values.length === 1) return inner;
    }

    return null;
};

export const string = (): SchemaNodeLike<"string", string> => {
    return createSchemaNode<"string", string, string, string, {}>("string", {});
};

export const number = (): SchemaNodeLike<"number", number> => {
    return createSchemaNode<"number", number, number, number, {}>("number", {});
};

export const boolean = (): SchemaNodeLike<"boolean", boolean> => {
    return createSchemaNode<"boolean", boolean, boolean, boolean, {}>("boolean", {});
};

export const nullType = (): SchemaNodeLike<"null", null> => {
    return createSchemaNode<"null", null, null, null, {}>("null", {});
};

type SchemaNodeLike<TKind extends string, TValue> = import("./node").SchemaNode<
    TKind,
    TValue,
    TValue,
    TValue
>;

export const literal = <T extends string | number | boolean>(
    value: T,
): LiteralNode<T> & { value: T } => {
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        throw new CrdtSchemaError(
            "s.literal only accepts JSON primitives (string, number, boolean)",
        );
    }

    return createSchemaNode<"literal", T, T, T, { value: T }>("literal", { value });
};

export const enumType = <const TValues extends readonly string[]>(
    values: TValues,
): EnumNode<TValues[number]> & { values: TValues } => {
    if (!values.length) {
        throw new CrdtSchemaError("s.enum requires at least one value");
    }

    const unique = new Set(values);
    if (unique.size !== values.length) {
        throw new CrdtSchemaError("s.enum values must be unique");
    }

    values.forEach((value) => {
        if (typeof value !== "string") {
            throw new CrdtSchemaError("s.enum values must be strings");
        }
    });

    return createSchemaNode<
        "enum",
        TValues[number],
        TValues[number],
        TValues[number],
        { values: TValues }
    >("enum", { values });
};

export const array = <TItem extends AnySchemaNode>(
    item: TItem,
): ArrayNode<TItem> & { item: TItem } => {
    assertNotOptional(item, "s.array item");
    assertJsonSchema(item, "s.array item");

    return createSchemaNode("array", { item }) as ArrayNode<TItem> & { item: TItem };
};

export const object = <TShape extends Record<string, AnySchemaNode>>(
    shape: TShape,
): ObjectNode<TShape> => {
    Object.entries(shape).forEach(([key, field]) => {
        if (!isSchemaNode(field)) {
            throw new CrdtSchemaError(`s.object field "${key}" must be a schema node`);
        }

        const inner = unwrapOptional(field);
        assertJsonSchema(inner, `s.object field "${key}"`);
    });

    return createSchemaNode("object", { shape }) as ObjectNode<TShape>;
};

export const record = <TValue extends AnySchemaNode>(
    value: TValue,
): RecordNode<TValue> & { value: TValue } => {
    assertNotOptional(value, "s.record value");
    assertJsonSchema(value, "s.record value");

    return createSchemaNode("record", { value }) as RecordNode<TValue> & { value: TValue };
};

export const $union = <const TOptions extends readonly AnySchemaNode[]>(
    options: TOptions,
): UnionNode<TOptions> => {
    if (options.length < 2) {
        throw new CrdtSchemaError("s.$union requires at least two options");
    }

    options.forEach((option, index) => {
        assertNotOptional(option, `s.$union option[${index}]`);
        if (!isSchemaNode(option)) {
            throw new CrdtSchemaError(`s.$union option[${index}] must be a schema node`);
        }
    });

    return createSchemaNode("union", { options }) as UnionNode<TOptions>;
};

export const $intersection = <const TOptions extends readonly AnySchemaNode[]>(
    options: TOptions,
): IntersectionNode<TOptions> => {
    if (options.length < 2) {
        throw new CrdtSchemaError("s.$intersection requires at least two options");
    }

    options.forEach((option, index) => {
        assertNotOptional(option, `s.$intersection option[${index}]`);
        assertJsonSchema(option, `s.$intersection option[${index}]`);
        assertObjectLike(option, `s.$intersection option[${index}]`);
    });

    flattenObjectShape(
        createSchemaNode("intersection", { options }) as AnySchemaNode,
        "s.$intersection",
    );

    return createSchemaNode("intersection", { options }) as IntersectionNode<TOptions>;
};

export const $discriminatedUnion = <
    TKey extends string,
    const TOptions extends readonly AnySchemaNode[],
>(
    key: TKey,
    options: TOptions,
): DiscriminatedUnionNode<TKey, TOptions> => {
    if (options.length < 2) {
        throw new CrdtSchemaError("s.$discriminatedUnion requires at least two options");
    }

    const tags = new Set<unknown>();

    options.forEach((option, index) => {
        assertNotOptional(option, `s.$discriminatedUnion option[${index}]`);
        assertJsonSchema(option, `s.$discriminatedUnion option[${index}]`);
        assertObjectLike(option, `s.$discriminatedUnion option[${index}]`);

        const field = getDiscriminatorField(option, key);

        if (!field) {
            throw new CrdtSchemaError(
                `s.$discriminatedUnion option[${index}] must have a literal (or single-value enum) field "${key}"`,
            );
        }

        const tag =
            field.kind === "literal"
                ? (field as LiteralNode<string | number | boolean> & { value: unknown }).value
                : (field as EnumNode<string> & { values: readonly string[] }).values[0];

        if (tags.has(tag)) {
            throw new CrdtSchemaError(`s.$discriminatedUnion has duplicate tag "${String(tag)}"`);
        }

        tags.add(tag);
    });

    return createSchemaNode("discriminatedUnion", {
        discriminator: key,
        options,
    }) as DiscriminatedUnionNode<TKey, TOptions>;
};

export const $nullable = <TInner extends AnySchemaNode>(
    inner: TInner,
): UnionNode<readonly [TInner, SchemaNodeLike<"null", null>]> => {
    assertNotOptional(inner, "s.$nullable");

    return $union([inner, nullType()] as const);
};

export const $optional = <TInner extends AnySchemaNode>(inner: TInner): OptionalNode<TInner> => {
    if (isOptionalNode(inner)) {
        throw new CrdtSchemaError("s.$optional cannot wrap another s.$optional");
    }

    assertJsonSchema(inner, "s.$optional");

    return createSchemaNode("optional", { inner }) as OptionalNode<TInner>;
};

export const s = {
    string,
    number,
    boolean,
    null: nullType,
    literal,
    enum: enumType,
    array,
    object,
    record,
    $union,
    $discriminatedUnion,
    $intersection,
    $nullable,
    $optional,
};

const fromJSONUnknown = (ast: SchemaAst): AnySchemaNode => {
    switch (ast.kind) {
        case "string":
            return string();
        case "number":
            return number();
        case "boolean":
            return boolean();
        case "null":
            return nullType();
        case "literal":
            return literal(ast.value as string | number | boolean);
        case "enum":
            return enumType(ast.values as readonly string[]);
        case "array":
            return array(fromJSONUnknown(ast.item as SchemaAst));
        case "object": {
            const shape = Object.entries((ast.shape as Record<string, SchemaAst>) ?? {}).reduce<
                Record<string, AnySchemaNode>
            >((acc, [key, value]) => {
                acc[key] = fromJSONUnknown(value);
                return acc;
            }, {});
            return object(shape);
        }
        case "record":
            return record(fromJSONUnknown(ast.value as SchemaAst));
        case "union":
            return $union(
                (ast.options as SchemaAst[]).map(
                    fromJSONUnknown,
                ) as unknown as readonly AnySchemaNode[],
            );
        case "intersection":
            return $intersection(
                (ast.options as SchemaAst[]).map(
                    fromJSONUnknown,
                ) as unknown as readonly AnySchemaNode[],
            );
        case "discriminatedUnion":
            return $discriminatedUnion(
                ast.discriminator as string,
                (ast.options as SchemaAst[]).map(
                    fromJSONUnknown,
                ) as unknown as readonly AnySchemaNode[],
            );
        case "optional":
            return $optional(fromJSONUnknown(ast.inner as SchemaAst));
        default:
            throw new CrdtSchemaError(`Unknown JSON schema kind "${ast.kind}"`);
    }
};

export const fromJSON = fromJSONUnknown;

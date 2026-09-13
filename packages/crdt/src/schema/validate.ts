import { CrdtSchemaError } from "./error";
import { isUnseedableKind } from "./kinds";
import type { AnySchemaNode } from "./node";
import { isOptionalNode, unwrapOptional } from "./node";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const flattenObjectShape = (node: AnySchemaNode): Record<string, AnySchemaNode> => {
    if (node.kind === "object") {
        return (node as AnySchemaNode & { shape: Record<string, AnySchemaNode> }).shape;
    }

    if (node.kind === "intersection") {
        const options = (node as AnySchemaNode & { options: readonly AnySchemaNode[] }).options;

        return options.reduce<Record<string, AnySchemaNode>>((acc, option) => {
            const shape = flattenObjectShape(option);
            Object.entries(shape).forEach(([key, field]) => {
                acc[key] = field;
            });
            return acc;
        }, {});
    }

    throw new CrdtSchemaError(`Expected an object schema, received "${node.kind}"`);
};

const matchesLiteralOrEnum = (node: AnySchemaNode, value: unknown): boolean => {
    if (node.kind === "literal") {
        return (node as AnySchemaNode & { value: unknown }).value === value;
    }

    if (node.kind === "enum") {
        const values = (node as AnySchemaNode & { values: readonly unknown[] }).values;
        return values.includes(value);
    }

    return false;
};

export const validateJson = (node: AnySchemaNode, value: unknown): boolean => {
    const current = unwrapOptional(node);

    switch (current.kind) {
        case "string":
            return typeof value === "string";
        case "number":
            return typeof value === "number" && Number.isFinite(value);
        case "boolean":
            return typeof value === "boolean";
        case "null":
            return value === null;
        case "literal":
            return (current as AnySchemaNode & { value: unknown }).value === value;
        case "enum":
            return (current as AnySchemaNode & { values: readonly unknown[] }).values.includes(
                value,
            );
        case "array": {
            if (!Array.isArray(value)) return false;
            const item = (current as AnySchemaNode & { item: AnySchemaNode }).item;
            return value.every((entry) => validateJson(item, entry));
        }
        case "object": {
            if (!isPlainObject(value)) return false;
            const shape = (current as AnySchemaNode & { shape: Record<string, AnySchemaNode> })
                .shape;
            const extra = Object.keys(value).filter((key) => !(key in shape));
            if (extra.length) return false;

            return Object.entries(shape).every(([key, field]) => {
                if (!(key in value)) return isOptionalNode(field);
                return validateJson(field, value[key]);
            });
        }
        case "record": {
            if (!isPlainObject(value)) return false;
            const field = (current as AnySchemaNode & { value: AnySchemaNode }).value;
            return Object.values(value).every((entry) => validateJson(field, entry));
        }
        case "union": {
            const options = (current as AnySchemaNode & { options: readonly AnySchemaNode[] })
                .options;
            return options.some((option) => validateJson(option, value));
        }
        case "intersection": {
            try {
                const shape = flattenObjectShape(current);
                return validateJson(
                    { ...current, kind: "object", shape, toJSON: current.toJSON } as AnySchemaNode,
                    value,
                );
            } catch {
                return false;
            }
        }
        case "discriminatedUnion": {
            if (!isPlainObject(value)) return false;
            const discriminator = (current as AnySchemaNode & { discriminator: string })
                .discriminator;
            const options = (current as AnySchemaNode & { options: readonly AnySchemaNode[] })
                .options;
            const tag = value[discriminator];
            const option = options.find((branch) => {
                const field = flattenObjectShape(branch)[discriminator];
                return field ? matchesLiteralOrEnum(unwrapOptional(field), tag) : false;
            });
            return option ? validateJson(option, value) : false;
        }
        default:
            if (isUnseedableKind(current.kind)) return false;
            if (current.kind === "yText" || current.kind === "loroText")
                return typeof value === "string";
            if (current.kind === "loroCounter")
                return typeof value === "number" && Number.isFinite(value);
            if (
                current.kind === "yArray" ||
                current.kind === "loroList" ||
                current.kind === "loroMovableList"
            ) {
                return Array.isArray(value);
            }
            if (current.kind === "yMap" || current.kind === "loroMap") {
                return isPlainObject(value);
            }
            return false;
    }
};

export const assertJsonValue = (node: AnySchemaNode, value: unknown, context: string): void => {
    if (validateJson(node, value)) return;

    throw new CrdtSchemaError(`${context} does not match schema kind "${node.kind}"`);
};

export const pickUnionOption = (node: AnySchemaNode, value: unknown): AnySchemaNode | null => {
    if (node.kind === "union") {
        const options = (node as AnySchemaNode & { options: readonly AnySchemaNode[] }).options;
        return options.find((option) => canHydrate(option, value)) ?? null;
    }

    if (node.kind === "discriminatedUnion") {
        if (!isPlainObject(value)) return null;
        const discriminator = (node as AnySchemaNode & { discriminator: string }).discriminator;
        const options = (node as AnySchemaNode & { options: readonly AnySchemaNode[] }).options;
        const tag = value[discriminator];

        return (
            options.find((branch) => {
                const field = flattenObjectShape(branch)[discriminator];
                return field ? matchesLiteralOrEnum(unwrapOptional(field), tag) : false;
            }) ?? null
        );
    }

    return node;
};

export const canHydrate = (node: AnySchemaNode, value: unknown): boolean => {
    const current = unwrapOptional(node);

    if (current.kind === "union" || current.kind === "discriminatedUnion") {
        return pickUnionOption(current, value) !== null;
    }

    return validateJson(current, value);
};

import {
    CrdtSchemaError,
    assertJsonValue,
    flattenObjectShape,
    isJsonKind,
    isUnseedableKind,
    pickUnionOption,
    unwrapOptional,
    type AnySchemaNode,
} from "@pluv/crdt";
import {
    Array as YArray,
    Doc as YDoc,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
} from "yjs";
import type { YjsSchema } from "./schema";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const getYjsShare = (doc: YDoc, key: string, kind: string) => {
    switch (kind) {
        case "yArray":
            return doc.getArray(key);
        case "yMap":
            return doc.getMap(key);
        case "yText":
            return doc.getText(key);
        case "yXmlElement":
            return doc.getXmlElement(key);
        case "yXmlFragment":
            return doc.getXmlFragment(key);
        case "yXmlText":
            return doc.get(key, YXmlText);
        default:
            throw new CrdtSchemaError(`Cannot bind Yjs share for kind "${kind}"`);
    }
};

export const hydrateValue = (node: AnySchemaNode, json: unknown): unknown => {
    const current = unwrapOptional(node);

    if (current.kind === "union" || current.kind === "discriminatedUnion") {
        const option = pickUnionOption(current, json);

        if (!option) {
            throw new CrdtSchemaError(`No ${current.kind} option matched`);
        }

        return hydrateValue(option, json);
    }

    if (current.kind === "intersection") {
        const shape = flattenObjectShape(current);
        return hydrateValue(
            { ...current, kind: "object", shape, toJSON: current.toJSON } as AnySchemaNode,
            json,
        );
    }

    if (current.kind === "object") {
        assertJsonValue(current, json, "JSON object");
        const shape = (current as AnySchemaNode & { shape: Record<string, AnySchemaNode> }).shape;
        const source = json as Record<string, unknown>;

        return Object.entries(shape).reduce<Record<string, unknown>>((acc, [key, field]) => {
            if (!(key in source)) return acc;
            acc[key] = hydrateValue(unwrapOptional(field), source[key]);
            return acc;
        }, {});
    }

    if (current.kind === "array") {
        assertJsonValue(current, json, "JSON array");
        const item = (current as AnySchemaNode & { item: AnySchemaNode }).item;
        return (json as unknown[]).map((entry) => hydrateValue(item, entry));
    }

    if (current.kind === "record") {
        assertJsonValue(current, json, "JSON record");
        const value = (current as AnySchemaNode & { value: AnySchemaNode }).value;
        return Object.entries(json as Record<string, unknown>).reduce<Record<string, unknown>>(
            (acc, [key, entry]) => {
                acc[key] = hydrateValue(value, entry);
                return acc;
            },
            {},
        );
    }

    if (isJsonKind(current.kind)) {
        assertJsonValue(current, json, `JSON ${current.kind}`);
        return json;
    }

    switch (current.kind) {
        case "yArray": {
            if (!Array.isArray(json)) {
                throw new CrdtSchemaError("Expected an array to hydrate yArray");
            }

            const item = (current as AnySchemaNode & { item: AnySchemaNode }).item;
            const array = new YArray();

            json.forEach((entry, index) => {
                array.insert(index, [hydrateValue(item, entry)]);
            });

            return array;
        }
        case "yMap": {
            if (!isPlainObject(json)) {
                throw new CrdtSchemaError("Expected an object to hydrate yMap");
            }

            const value = (current as AnySchemaNode & { value: AnySchemaNode }).value;
            const map = new YMap();

            Object.entries(json).forEach(([key, entry]) => {
                map.set(key, hydrateValue(value, entry));
            });

            return map;
        }
        case "yText": {
            if (typeof json !== "string") {
                throw new CrdtSchemaError("Expected a string to hydrate yText");
            }

            const text = new YText();
            if (json) text.insert(0, json);
            return text;
        }
        default:
            throw new CrdtSchemaError(`Cannot hydrate schema kind "${current.kind}" from JSON`);
    }
};

const fillShare = (share: unknown, node: AnySchemaNode, json: unknown): void => {
    switch (node.kind) {
        case "yArray": {
            if (!Array.isArray(json)) {
                throw new CrdtSchemaError("Expected an array to seed yArray");
            }

            const item = (node as AnySchemaNode & { item: AnySchemaNode }).item;
            const array = share as YArray<unknown>;

            json.forEach((entry, index) => {
                array.insert(index, [hydrateValue(item, entry)]);
            });
            return;
        }
        case "yMap": {
            if (!isPlainObject(json)) {
                throw new CrdtSchemaError("Expected an object to seed yMap");
            }

            const value = (node as AnySchemaNode & { value: AnySchemaNode }).value;
            const map = share as YMap<unknown>;

            Object.entries(json).forEach(([key, entry]) => {
                map.set(key, hydrateValue(value, entry));
            });
            return;
        }
        case "yText": {
            if (typeof json !== "string") {
                throw new CrdtSchemaError("Expected a string to seed yText");
            }

            const text = share as YText;
            if (json) text.insert(0, json);
            return;
        }
        default:
            throw new CrdtSchemaError(`Cannot seed kind "${node.kind}"`);
    }
};

export const hydrateTopLevel = (
    doc: YDoc,
    schema: YjsSchema,
    seed?: Record<string, unknown>,
): Record<string, unknown> => {
    if (seed) {
        const extra = Object.keys(seed).filter((key) => !(key in schema.shape));

        if (extra.length) {
            throw new CrdtSchemaError(`Unexpected seed keys: ${extra.join(", ")}`);
        }
    }

    return Object.entries(schema.shape).reduce<Record<string, unknown>>((acc, [key, node]) => {
        const share = getYjsShare(doc, key, node.kind);
        const value = seed?.[key];

        if (value !== undefined) {
            if (isUnseedableKind(node.kind)) {
                throw new CrdtSchemaError(`Cannot JSON-seed "${key}" (${node.kind})`);
            }

            fillShare(share, node, value);
        }

        acc[key] = share;
        return acc;
    }, {});
};

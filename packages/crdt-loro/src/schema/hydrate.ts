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
import type { Container } from "loro-crdt";
import {
    isContainer,
    LoroCounter,
    LoroDoc,
    LoroList,
    LoroMap,
    LoroMovableList,
    LoroText,
} from "loro-crdt";
import type { LoroSchema } from "./schema";

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const insertIntoList = (list: LoroList | LoroMovableList, index: number, value: unknown) => {
    if (isContainer(value as Container)) list.insertContainer(index, value as Container);
    else list.insert(index, value as never);
};

const setOnMap = (map: LoroMap, key: string, value: unknown) => {
    if (isContainer(value as Container)) map.setContainer(key, value as Container);
    else map.set(key, value as never);
};

export const getLoroShare = (doc: LoroDoc, key: string, kind: string) => {
    switch (kind) {
        case "loroList":
            return doc.getList(key);
        case "loroMap":
            return doc.getMap(key);
        case "loroText":
            return doc.getText(key);
        case "loroMovableList":
            return doc.getMovableList(key);
        case "loroCounter":
            return doc.getCounter(key);
        case "loroTree":
            return doc.getTree(key);
        default:
            throw new CrdtSchemaError(`Cannot bind Loro share for kind "${kind}"`);
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
        case "loroList":
        case "loroMovableList": {
            if (!Array.isArray(json)) {
                throw new CrdtSchemaError(`Expected an array to hydrate ${current.kind}`);
            }

            const item = (current as AnySchemaNode & { item: AnySchemaNode }).item;
            const list = current.kind === "loroList" ? new LoroList() : new LoroMovableList();

            json.forEach((entry, index) => {
                insertIntoList(list, index, hydrateValue(item, entry));
            });

            return list;
        }
        case "loroMap": {
            if (!isPlainObject(json)) {
                throw new CrdtSchemaError("Expected an object to hydrate loroMap");
            }

            const value = (current as AnySchemaNode & { value: AnySchemaNode }).value;
            const map = new LoroMap();

            Object.entries(json).forEach(([key, entry]) => {
                setOnMap(map, key, hydrateValue(value, entry));
            });

            return map;
        }
        case "loroText": {
            if (typeof json !== "string") {
                throw new CrdtSchemaError("Expected a string to hydrate loroText");
            }

            const text = new LoroText();
            if (json) text.insert(0, json);
            return text;
        }
        case "loroCounter": {
            if (typeof json !== "number" || !Number.isFinite(json)) {
                throw new CrdtSchemaError("Expected a number to hydrate loroCounter");
            }

            const counter = new LoroCounter();
            if (json !== 0) counter.increment(json);
            return counter;
        }
        default:
            throw new CrdtSchemaError(`Cannot hydrate schema kind "${current.kind}" from JSON`);
    }
};

const fillShare = (share: unknown, node: AnySchemaNode, json: unknown): void => {
    switch (node.kind) {
        case "loroList":
        case "loroMovableList": {
            if (!Array.isArray(json)) {
                throw new CrdtSchemaError(`Expected an array to seed ${node.kind}`);
            }

            const item = (node as AnySchemaNode & { item: AnySchemaNode }).item;
            const list = share as LoroList | LoroMovableList;

            json.forEach((entry, index) => {
                insertIntoList(list, index, hydrateValue(item, entry));
            });
            return;
        }
        case "loroMap": {
            if (!isPlainObject(json)) {
                throw new CrdtSchemaError("Expected an object to seed loroMap");
            }

            const value = (node as AnySchemaNode & { value: AnySchemaNode }).value;
            const map = share as LoroMap;

            Object.entries(json).forEach(([key, entry]) => {
                setOnMap(map, key, hydrateValue(value, entry));
            });
            return;
        }
        case "loroText": {
            if (typeof json !== "string") {
                throw new CrdtSchemaError("Expected a string to seed loroText");
            }

            const text = share as LoroText;
            if (json) text.insert(0, json);
            return;
        }
        case "loroCounter": {
            if (typeof json !== "number" || !Number.isFinite(json)) {
                throw new CrdtSchemaError("Expected a number to seed loroCounter");
            }

            const counter = share as LoroCounter;
            if (json !== 0) counter.increment(json);
            return;
        }
        default:
            throw new CrdtSchemaError(`Cannot seed kind "${node.kind}"`);
    }
};

export const hydrateTopLevel = (
    doc: LoroDoc,
    schema: LoroSchema,
    seed?: Record<string, unknown>,
): Record<string, unknown> => {
    if (seed) {
        const extra = Object.keys(seed).filter((key) => !(key in schema.shape));

        if (extra.length) {
            throw new CrdtSchemaError(`Unexpected seed keys: ${extra.join(", ")}`);
        }
    }

    return Object.entries(schema.shape).reduce<Record<string, unknown>>((acc, [key, node]) => {
        const share = getLoroShare(doc, key, node.kind);
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

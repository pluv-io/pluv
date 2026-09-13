export const JSON_KINDS = [
    "string",
    "number",
    "boolean",
    "null",
    "literal",
    "enum",
    "array",
    "object",
    "record",
    "union",
    "intersection",
    "discriminatedUnion",
    "optional",
] as const;

export type JsonSchemaKind = (typeof JSON_KINDS)[number];

export const YJS_CRDT_KINDS = [
    "yArray",
    "yMap",
    "yText",
    "yXmlText",
    "yXmlElement",
    "yXmlFragment",
] as const;

export type YjsCrdtKind = (typeof YJS_CRDT_KINDS)[number];

export const LORO_CRDT_KINDS = [
    "loroList",
    "loroMap",
    "loroText",
    "loroMovableList",
    "loroCounter",
    "loroTree",
] as const;

export type LoroCrdtKind = (typeof LORO_CRDT_KINDS)[number];

export const CRDT_KINDS = [...YJS_CRDT_KINDS, ...LORO_CRDT_KINDS] as const;

export type CrdtSchemaKind = (typeof CRDT_KINDS)[number];

export const DOC_KINDS = ["y.doc", "loro.doc"] as const;

export type DocSchemaKind = (typeof DOC_KINDS)[number];

export const isJsonKind = (kind: string): kind is JsonSchemaKind => {
    return (JSON_KINDS as readonly string[]).includes(kind);
};

export const isYjsCrdtKind = (kind: string): kind is YjsCrdtKind => {
    return (YJS_CRDT_KINDS as readonly string[]).includes(kind);
};

export const isLoroCrdtKind = (kind: string): kind is LoroCrdtKind => {
    return (LORO_CRDT_KINDS as readonly string[]).includes(kind);
};

export const isCrdtKind = (kind: string): kind is CrdtSchemaKind => {
    return (CRDT_KINDS as readonly string[]).includes(kind);
};

export const isXmlKind = (kind: string): boolean => {
    return kind === "yXmlText" || kind === "yXmlElement" || kind === "yXmlFragment";
};

export const isUnseedableKind = (kind: string): boolean => {
    return isXmlKind(kind) || kind === "loroTree";
};

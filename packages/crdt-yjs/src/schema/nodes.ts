import {
    assertNotOptional,
    createSchemaNode,
    type AnySchemaNode,
    type InferNodeJson,
    type InferNodeSeed,
    type InferNodeStorage,
    type SchemaNode,
} from "@pluv/crdt";
import {
    Array as YArray,
    Map as YMap,
    Text as YText,
    XmlElement as YXmlElement,
    XmlFragment as YXmlFragment,
    XmlText as YXmlText,
} from "yjs";

export type YjsArrayNode<TItem extends AnySchemaNode> = SchemaNode<
    "yArray",
    YArray<InferNodeStorage<TItem>>,
    InferNodeJson<TItem>[],
    InferNodeSeed<TItem>[]
> & { readonly item: TItem };

export type YjsMapNode<TValue extends AnySchemaNode> = SchemaNode<
    "yMap",
    YMap<InferNodeStorage<TValue>>,
    Record<string, InferNodeJson<TValue>>,
    Record<string, InferNodeSeed<TValue>>
> & { readonly value: TValue };

export type YjsTextNode = SchemaNode<"yText", YText, string, string>;
export type YjsXmlTextNode = SchemaNode<"yXmlText", YXmlText, string, never>;
export type YjsXmlElementNode = SchemaNode<"yXmlElement", YXmlElement, string, never>;
export type YjsXmlFragmentNode = SchemaNode<"yXmlFragment", YXmlFragment, string, never>;

export const yArray = <TItem extends AnySchemaNode>(item: TItem): YjsArrayNode<TItem> => {
    assertNotOptional(item, "yjs.yArray item");

    return createSchemaNode("yArray", { item }) as YjsArrayNode<TItem>;
};

export const yMap = <TValue extends AnySchemaNode>(value: TValue): YjsMapNode<TValue> => {
    assertNotOptional(value, "yjs.yMap value");

    return createSchemaNode("yMap", { value }) as YjsMapNode<TValue>;
};

export const yText = (): YjsTextNode => {
    return createSchemaNode("yText", {}) as YjsTextNode;
};

export const yXmlText = (): YjsXmlTextNode => {
    return createSchemaNode("yXmlText", {}) as YjsXmlTextNode;
};

export const yXmlElement = (): YjsXmlElementNode => {
    return createSchemaNode("yXmlElement", {}) as YjsXmlElementNode;
};

export const yXmlFragment = (): YjsXmlFragmentNode => {
    return createSchemaNode("yXmlFragment", {}) as YjsXmlFragmentNode;
};

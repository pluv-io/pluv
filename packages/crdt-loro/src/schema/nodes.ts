import {
    assertNotOptional,
    createSchemaNode,
    type AnySchemaNode,
    type InferNodeJson,
    type InferNodeSeed,
    type InferNodeStorage,
    type SchemaNode,
} from "@pluv/crdt";
import type {
    LoroCounter,
    LoroList,
    LoroMap,
    LoroMovableList,
    LoroText,
    LoroTree,
} from "loro-crdt";

export type LoroListNode<TItem extends AnySchemaNode> = SchemaNode<
    "loroList",
    LoroList<InferNodeStorage<TItem>>,
    InferNodeJson<TItem>[],
    InferNodeSeed<TItem>[]
> & { readonly item: TItem };

export type LoroMapNode<TValue extends AnySchemaNode> = SchemaNode<
    "loroMap",
    LoroMap<Record<string, InferNodeStorage<TValue>>>,
    Record<string, InferNodeJson<TValue>>,
    Record<string, InferNodeSeed<TValue>>
> & { readonly value: TValue };

export type LoroTextNode = SchemaNode<"loroText", LoroText, string, string>;
export type LoroMovableListNode<TItem extends AnySchemaNode> = SchemaNode<
    "loroMovableList",
    LoroMovableList<InferNodeStorage<TItem>>,
    InferNodeJson<TItem>[],
    InferNodeSeed<TItem>[]
> & { readonly item: TItem };
export type LoroCounterNode = SchemaNode<"loroCounter", LoroCounter, number, number>;
export type LoroTreeNode = SchemaNode<"loroTree", LoroTree, unknown, never>;

export const loroList = <TItem extends AnySchemaNode>(item: TItem): LoroListNode<TItem> => {
    assertNotOptional(item, "loro.loroList item");

    return createSchemaNode("loroList", { item }) as LoroListNode<TItem>;
};

export const loroMap = <TValue extends AnySchemaNode>(value: TValue): LoroMapNode<TValue> => {
    assertNotOptional(value, "loro.loroMap value");

    return createSchemaNode("loroMap", { value }) as LoroMapNode<TValue>;
};

export const loroText = (): LoroTextNode => {
    return createSchemaNode("loroText", {}) as LoroTextNode;
};

export const loroMovableList = <TItem extends AnySchemaNode>(
    item: TItem,
): LoroMovableListNode<TItem> => {
    assertNotOptional(item, "loro.loroMovableList item");

    return createSchemaNode("loroMovableList", { item }) as LoroMovableListNode<TItem>;
};

export const loroCounter = (): LoroCounterNode => {
    return createSchemaNode("loroCounter", {}) as LoroCounterNode;
};

export const loroTree = (): LoroTreeNode => {
    return createSchemaNode("loroTree", {}) as LoroTreeNode;
};

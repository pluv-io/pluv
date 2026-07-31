import { LoroTree } from "loro-crdt";

export const tree = <T extends Record<string, unknown>>() => {
    const container = new LoroTree<T>();

    return container;
};

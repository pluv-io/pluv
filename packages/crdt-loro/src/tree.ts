import { LoroTree } from "loro-crdt";

export const tree = <T extends Record<string, unknown>>() => {
    return new LoroTree<T>();
};

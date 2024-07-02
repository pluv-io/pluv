import type { Container } from "loro-crdt";
import { LoroMap, isContainer } from "loro-crdt";
import type { LoroType } from "./types";

export const object = <T extends Record<string, any>>(value: T): LoroType<LoroMap<T>, T> => {
    const container = new LoroMap();

    Object.entries(value).forEach(([key, item]) => {
        isContainer(item) ? container.setContainer(key, item) : container.set(key, item as Exclude<T, Container>);
    });

    return container as LoroType<LoroMap<T>, T>;
};

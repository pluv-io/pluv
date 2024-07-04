import type { Container } from "loro-crdt";
import { LoroList, isContainer } from "loro-crdt";
import type { LoroType } from "./types";

export const list = <T extends unknown>(value: T[] | readonly T[] = []): LoroType<LoroList<T>, T[]> => {
    const container = new LoroList();

    value.forEach((item, i) => {
        isContainer(item) ? container.insertContainer(i, item) : container.insert(i, item as Exclude<T, Container>);
    });

    return container as unknown as LoroType<LoroList<T>, T[]>;
};

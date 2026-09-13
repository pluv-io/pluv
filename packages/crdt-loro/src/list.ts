import type { Container } from "loro-crdt";
import { LoroList, isContainer } from "loro-crdt";

export const list = <T extends unknown>(value: T[] | readonly T[] = []): LoroList<T> => {
    const container = new LoroList<T>();

    value.forEach((item, i) => {
        if (isContainer(item)) container.insertContainer(i, item);
        else container.insert(i, item as Exclude<T, Container>);
    });

    return container;
};

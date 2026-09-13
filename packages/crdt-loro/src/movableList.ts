import type { Container } from "loro-crdt";
import { isContainer, LoroMovableList } from "loro-crdt";

export const movableList = <T extends unknown>(
    value: T[] | readonly T[] = [],
): LoroMovableList<T> => {
    const container = new LoroMovableList<T>();

    value.forEach((item, i) => {
        if (isContainer(item)) container.insertContainer(i, item);
        else container.insert(i, item as Exclude<T, Container>);
    });

    return container;
};

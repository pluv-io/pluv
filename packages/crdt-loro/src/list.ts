import type { Container } from "loro-crdt";
import { LoroList, isContainer } from "loro-crdt";
import type { LoroType } from "./types";

export const list = <T extends unknown>(
    value: T[] | readonly T[] = [],
): LoroType<LoroList<T>, T[]> => {
    const container = new LoroList();

    value.forEach((item, i) => {
        if (isContainer(item)) container.insertContainer(i, item);
        else container.insert(i, item as Exclude<T, Container>);
    });

    return container as unknown as LoroType<LoroList<T>, T[]>;
};

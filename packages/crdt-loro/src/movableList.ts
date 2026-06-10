import type { Container } from "@loro-runtime";
import { isContainer, LoroMovableList } from "@loro-runtime";
import type { LoroType } from "./types";

export const movableList = <T extends unknown>(value: T[] | readonly T[] = []) => {
    const container = new LoroMovableList();

    value.forEach((item, i) => {
        if (isContainer(item)) container.insertContainer(i, item);
        else container.insert(i, item as Exclude<T, Container>);
    });

    return container as unknown as LoroType<LoroMovableList<T>, T[]>;
};

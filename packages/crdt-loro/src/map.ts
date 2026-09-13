import type { Container } from "loro-crdt";
import { LoroMap, isContainer } from "loro-crdt";

export const map = <T extends unknown>(
    value: readonly (readonly [key: string, value: T])[] = [],
): LoroMap<Record<string, T>> => {
    const container = new LoroMap();

    value.forEach(([key, item]) => {
        if (isContainer(item)) container.setContainer(key, item);
        else container.set(key, item as Exclude<T, Container>);
    });

    return container as LoroMap<Record<string, T>>;
};

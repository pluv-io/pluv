import type {
    Container,
    LoroCounter,
    LoroDoc,
    LoroList,
    LoroMap,
    LoroMovableList,
    LoroText,
} from "loro-crdt";
import { isContainer } from "loro-crdt";
import type { LoroType } from "../types";

export type LoroBuilder = ReturnType<typeof builder>;

export const builder = (doc: LoroDoc) => {
    return {
        counter(name: string): LoroCounter {
            return doc.getCounter(name);
        },
        list<T extends unknown>(
            name: string,
            value: T[] | readonly T[] = [],
        ): LoroType<LoroList<T>, T[]> {
            const list = doc.getList(name);

            value.forEach((item, i) => {
                if (isContainer(item)) list.insertContainer(i, item);
                else list.insert(i, item as Exclude<T, Container>);
            });

            return list as unknown as LoroType<LoroList<T>, T[]>;
        },
        map<T extends Record<string, unknown>>(
            name: string,
            value: T = {} as T,
        ): LoroType<LoroMap<T>, T> {
            const container = doc.getMap(name);

            Object.entries(value).forEach(([key, item]) => {
                if (isContainer(item)) container.setContainer(key, item);
                else container.set(key, item as Exclude<T, Container>);
            });

            return container as unknown as LoroType<LoroMap<T>, T>;
        },
        moveableList<T extends unknown>(
            name: string,
            value: T[] | readonly T[] = [],
        ): LoroType<LoroMovableList<T>, T[]> {
            const list = doc.getMovableList(name);

            value.forEach((item, i) => {
                if (isContainer(item)) list.insertContainer(i, item);
                else list.insert(i, item as Exclude<T, Container>);
            });

            return list as unknown as LoroType<LoroMovableList<T>, T[]>;
        },
        text(name: string, value: string = ""): LoroType<LoroText, string> {
            const text = doc.getText(name);

            text.insert(0, value);

            return text as unknown as LoroType<LoroText, string>;
        },
        tree(name: string) {
            return doc.getTree(name);
        },
    };
};

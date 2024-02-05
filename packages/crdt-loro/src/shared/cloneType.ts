import {
    Container,
    LoroList,
    LoroMap,
    LoroText,
    getType,
    isContainer,
} from "loro-crdt";
import { isWrapper } from "./isWrapper";

interface CloneArrayParams<T extends unknown> {
    source: LoroList<T[]>;
    target: LoroList<T[]>;
}

interface CloneMapParams<T extends Record<string, any>> {
    source: LoroMap<T>;
    target: LoroMap<T>;
}

interface CloneTextParams {
    source: LoroText;
    target: LoroText;
}

export interface CloneTypeParams<TType extends Container> {
    source: TType;
    target: TType;
}

function cloneArray<T extends unknown>(params: CloneArrayParams<T>): void {
    const { source, target } = params;

    const items = source.toArray();

    items.forEach((item, i) => {
        const sourceItem =
            !isContainer(item) && isWrapper(item) ? item.value : item;

        if (isContainer(sourceItem)) {
            const containerType = getType(sourceItem);

            switch (containerType) {
                case "List": {
                    const loroList = target.insertContainer(i, "List");

                    cloneArray({
                        source: sourceItem as LoroList,
                        target: loroList,
                    });

                    return;
                }
                case "Map": {
                    const loroMap = target.insertContainer(i, "Map");

                    cloneMap({
                        source: sourceItem as LoroMap,
                        target: loroMap,
                    });

                    return;
                }
                case "Text": {
                    const loroText = target.insertContainer(i, "Text");

                    cloneText({
                        source: sourceItem as LoroText,
                        target: loroText,
                    });

                    return;
                }
                default:
                    throw new Error("This type is not yet supported");
            }
        }

        target.insert(i, item);
    });
}

function cloneMap<T extends Record<string, any>>(
    params: CloneMapParams<T>,
): void {
    const { source, target } = params;

    source.entries().forEach(([key, item]) => {
        const sourceItem =
            !isContainer(item) && isWrapper(item) ? item.value : item;

        if (isContainer(item)) {
            const containerType = getType(sourceItem);

            switch (containerType) {
                case "List": {
                    const loroList = target.setContainer(key, "List");

                    cloneArray({
                        source: sourceItem as LoroList,
                        target: loroList,
                    });

                    return;
                }
                case "Map": {
                    const loroMap = target.setContainer(key, "Map");

                    cloneMap({
                        source: sourceItem as LoroMap,
                        target: loroMap,
                    });

                    return;
                }
                case "Text": {
                    const loroText = target.setContainer(key, "Text");

                    cloneText({
                        source: sourceItem as LoroText,
                        target: loroText,
                    });

                    return;
                }
                default:
                    throw new Error("This type is not yet supported");
            }
        }

        target.set(key, item);
    });
}

function cloneText(params: CloneTextParams): void {
    const { source, target } = params;

    target.insert(0, source.toString());
}

export const cloneType = <TType extends Container>(
    params: CloneTypeParams<TType>,
) => {
    const { source, target } = params;

    const containerType = getType(target);

    switch (containerType) {
        case "List":
            return cloneArray({
                source: source as LoroList,
                target: target as LoroList,
            });
        case "Map": {
            return cloneMap({
                source: source as LoroMap,
                target: target as LoroMap,
            });
        }
        case "Text": {
            return cloneText({
                source: source as LoroText,
                target: target as LoroText,
            });
        }
        default:
            throw new Error("This type is not yet supported");
    }
};

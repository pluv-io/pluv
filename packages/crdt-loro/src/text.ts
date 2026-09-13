import { LoroText } from "loro-crdt";

export const text = (value: string = ""): LoroText => {
    const container = new LoroText();

    if (value) container.insert(0, value);

    return container;
};

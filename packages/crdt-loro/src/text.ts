import { LoroText } from "loro-crdt";
import type { LoroType } from "./types";

export const text = (value: string = ""): LoroType<LoroText, string> => {
    const container = new LoroText();

    container.insert(0, value);

    return container as LoroType<LoroText, string>;
};

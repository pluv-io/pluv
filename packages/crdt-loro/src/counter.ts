import { LoroCounter } from "@loro-runtime";
import { LoroType } from "./types";

export const counter = (): LoroCounter => {
    const counter = new LoroCounter();

    return counter as unknown as LoroType<LoroCounter, number>;
};

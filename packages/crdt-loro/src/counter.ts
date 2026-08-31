import { LoroCounter } from "loro-crdt";
import { LoroType } from "./types";

export const counter = (): LoroCounter => {
    const loroCounter = new LoroCounter();

    return loroCounter as unknown as LoroType<LoroCounter, number>;
};

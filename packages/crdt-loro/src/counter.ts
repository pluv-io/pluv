import { LoroCounter } from "loro-crdt";

export const counter = (): LoroCounter => {
    return new LoroCounter();
};

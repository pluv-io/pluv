import { NoopCrdtDocFactory } from "./NoopCrdtDocFactory";

export const noop = {
    doc: (args?: any) => new NoopCrdtDocFactory(),
};

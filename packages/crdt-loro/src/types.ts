import type { CrdtType } from "@pluv/crdt";

export type LoroType<TValue extends unknown, TJson extends unknown = any> = CrdtType<TValue, TJson> & {
    toJSON?: () => TJson;
    toString?: () => string;
};

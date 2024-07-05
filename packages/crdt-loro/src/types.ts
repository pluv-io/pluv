import type { CrdtType } from "@pluv/crdt";

export type LoroType<TValue extends unknown, TJson extends unknown = any> = TValue &
    CrdtType<TValue, TJson> & {
        toJSON?: () => any;
        toString?: () => string;
    };

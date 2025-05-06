import type { CrdtType } from "@pluv/crdt";

export type YjsType<TValue extends unknown, TJson extends unknown = any> = CrdtType<
    TValue,
    TJson
> & {
    initialValue?: any;
    toJSON: () => any;
};

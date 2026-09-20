import type { AbstractCrdtDocFactory } from "@pluv/crdt";
import type { IOLike, ProcedureLike, SetKey, StandardSchemaV1, TreatyLike } from "@pluv/types";

export type { SetKey };

/**
 * Client snapshot. Dependent constraints (storage vs treaty) are
 * enforced on `createClient().config()`, not inside this object type.
 */
export type ClientDefs = {
    io: IOLike;
    treaty: TreatyLike;
    presence: StandardSchemaV1<any, any> | undefined;
    metadata: StandardSchemaV1<any, any> | undefined;
    storage: AbstractCrdtDocFactory<any, any>;
    events: Record<string, ProcedureLike<any, any>>;
};

export type PatchDefs<TDefs extends ClientDefs, P extends Partial<ClientDefs>> = Omit<
    TDefs,
    keyof P
> &
    P;

import type { IOLikeDefs, SetKey } from "@pluv/types";
import type { AbstractPlatform } from "./AbstractPlatform";

export type { SetKey };

/**
 * Server IO snapshot. Dependent constraints (authorize/context vs platform) are
 * enforced on `createIO().platform().config()`, not inside this object type.
 */
export type IODefs = IOLikeDefs & {
    platform: AbstractPlatform<any, any, any, any>;
    context: Record<string, any>;
};

export type PatchDefs<T extends IODefs, P extends Partial<IODefs>> = Omit<T, keyof P> & P;

export type IOLikeFromDefs<T extends IODefs> = Pick<T, "authorize" | "crdt" | "events">;

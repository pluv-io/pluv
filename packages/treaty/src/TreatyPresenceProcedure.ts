import type { StandardSchemaV1, TreatyProcedureLike } from "@pluv/types";
import type { PresenceResolverContext } from "./types";

type PresenceProcedureDefs<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
> = {
    input: StandardSchemaV1<unknown, TInput> | null;
    resolve:
        | ((data: TInput, context: PresenceResolverContext<TUser, TPresence>) => Partial<TPresence>)
        | null;
};

export class TreatyPresenceProcedure<
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TInput extends Record<string, any> = {},
    TFilled extends "input" | "resolve" | "" = "",
> implements TreatyProcedureLike<"presence", TInput> {
    public readonly kind = "presence" as const;

    private readonly _defs: PresenceProcedureDefs<TInput, TUser, TPresence>;

    public get config(): TreatyProcedureLike<"presence", TInput>["config"] {
        return this._defs;
    }

    constructor(config: TreatyProcedureLike<"presence", TInput>["config"] = {}) {
        this._defs = {
            input: config.input ?? null,
            resolve:
                (config.resolve as
                    | ((
                          data: TInput,
                          context: PresenceResolverContext<TUser, TPresence>,
                      ) => Partial<TPresence>)
                    | null
                    | undefined) ?? null,
        };
    }

    public input<TData extends Record<string, any>>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<
        TreatyPresenceProcedure<TUser, TPresence, TData, TFilled | "input">,
        TFilled | "input"
    > {
        return new TreatyPresenceProcedure<TUser, TPresence, TData, TFilled | "input">({
            input,
        }) as Omit<
            TreatyPresenceProcedure<TUser, TPresence, TData, TFilled | "input">,
            TFilled | "input"
        >;
    }

    public resolve(
        resolver: (
            data: TInput,
            context: PresenceResolverContext<TUser, TPresence>,
        ) => Partial<TPresence>,
    ): Omit<
        TreatyPresenceProcedure<TUser, TPresence, TInput, TFilled | "input" | "resolve">,
        TFilled | "input" | "resolve"
    > {
        if (this._defs.resolve) throw new Error("Resolve was already defined for this procedure");

        return new TreatyPresenceProcedure<TUser, TPresence, TInput, TFilled | "input" | "resolve">(
            {
                ...this._defs,
                resolve: resolver,
            },
        ) as Omit<
            TreatyPresenceProcedure<TUser, TPresence, TInput, TFilled | "input" | "resolve">,
            TFilled | "input" | "resolve"
        >;
    }
}

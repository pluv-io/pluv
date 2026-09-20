import type { StandardSchemaV1, TreatyProcedureLike } from "@pluv/types";
import type { StorageResolverContext } from "./types";

type StorageProcedureDefs<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
> = {
    input: StandardSchemaV1<unknown, TInput> | null;
    resolve:
        | ((data: TInput, context: StorageResolverContext<TUser, TJson, TNative>) => void)
        | null;
};

export class TreatyStorageProcedure<
    TUser extends { id: string },
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TInput extends Record<string, any> = {},
    TFilled extends "input" | "resolve" | "" = "",
> implements TreatyProcedureLike<"storage", TInput> {
    public readonly kind = "storage" as const;

    private readonly _defs: StorageProcedureDefs<TInput, TUser, TJson, TNative>;

    public get config(): TreatyProcedureLike<"storage", TInput>["config"] {
        return this._defs;
    }

    constructor(config: TreatyProcedureLike<"storage", TInput>["config"] = {}) {
        this._defs = {
            input: config.input ?? null,
            resolve:
                (config.resolve as
                    | ((
                          data: TInput,
                          context: StorageResolverContext<TUser, TJson, TNative>,
                      ) => void)
                    | null
                    | undefined) ?? null,
        };
    }

    public input<TData extends Record<string, any>>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<
        TreatyStorageProcedure<TUser, TJson, TNative, TData, TFilled | "input">,
        TFilled | "input"
    > {
        return new TreatyStorageProcedure<TUser, TJson, TNative, TData, TFilled | "input">({
            input,
        }) as Omit<
            TreatyStorageProcedure<TUser, TJson, TNative, TData, TFilled | "input">,
            TFilled | "input"
        >;
    }

    public resolve(
        resolver: (data: TInput, context: StorageResolverContext<TUser, TJson, TNative>) => void,
    ): Omit<
        TreatyStorageProcedure<TUser, TJson, TNative, TInput, TFilled | "input" | "resolve">,
        TFilled | "input" | "resolve"
    > {
        if (this._defs.resolve) throw new Error("Resolve was already defined for this procedure");

        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TInput,
            TFilled | "input" | "resolve"
        >({
            ...this._defs,
            resolve: resolver,
        }) as Omit<
            TreatyStorageProcedure<TUser, TJson, TNative, TInput, TFilled | "input" | "resolve">,
            TFilled | "input" | "resolve"
        >;
    }
}

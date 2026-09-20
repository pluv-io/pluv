import type { StandardSchemaV1, TreatyProcedureLike } from "@pluv/types";
import { parseProcedureInput } from "./parseProcedureInput";
import { toStorageResolverContext } from "./toStorageResolverContext";
import type {
    StorageResolverContext,
    TreatyResolverDoc,
    TreatyStorageResolveOptions,
} from "./types";

type StorageProcedureDefs<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
> = {
    input: StandardSchemaV1<unknown, TInput> | null;
    resolve:
        | ((
              data: TInput,
              context: StorageResolverContext<TUser, TJson, TNative, TPresence>,
          ) => void)
        | null;
    transact: boolean;
};

export class TreatyStorageProcedure<
    TUser extends { id: string },
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPresence extends Record<string, any> = {},
    TInput extends Record<string, any> = {},
    TFilled extends "input" | "resolve" | "" = "",
> implements TreatyProcedureLike<"storage", TInput> {
    public readonly kind = "storage" as const;

    private readonly _defs: StorageProcedureDefs<TInput, TUser, TPresence, TJson, TNative>;

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
                          context: StorageResolverContext<TUser, TJson, TNative, TPresence>,
                      ) => void)
                    | null
                    | undefined) ?? null,
            transact: config.transact ?? true,
        };
    }

    public apply(
        data: unknown,
        params: {
            doc: TreatyResolverDoc<TJson, TNative>;
            presence?: TPresence | null;
            user: TUser;
        },
    ): void {
        if (!this._defs.resolve) {
            throw new Error("Treaty storage procedure is missing resolve");
        }

        const parsed = parseProcedureInput(this._defs.input, data);

        this._defs.resolve(parsed, toStorageResolverContext(params));
    }

    public input<TData extends Record<string, any>>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<
        TreatyStorageProcedure<TUser, TJson, TNative, TPresence, TData, TFilled | "input">,
        TFilled | "input"
    > {
        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TData,
            TFilled | "input"
        >({
            input,
        }) as Omit<
            TreatyStorageProcedure<TUser, TJson, TNative, TPresence, TData, TFilled | "input">,
            TFilled | "input"
        >;
    }

    public resolve(
        resolver: (
            data: TInput,
            context: StorageResolverContext<TUser, TJson, TNative, TPresence>,
        ) => void,
        options: TreatyStorageResolveOptions = {},
    ): Omit<
        TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TFilled | "input" | "resolve"
        >,
        TFilled | "input" | "resolve"
    > {
        if (this._defs.resolve) throw new Error("Resolve was already defined for this procedure");

        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TFilled | "input" | "resolve"
        >({
            ...this._defs,
            resolve: resolver,
            transact: options.transact ?? true,
        }) as Omit<
            TreatyStorageProcedure<
                TUser,
                TJson,
                TNative,
                TPresence,
                TInput,
                TFilled | "input" | "resolve"
            >,
            TFilled | "input" | "resolve"
        >;
    }
}

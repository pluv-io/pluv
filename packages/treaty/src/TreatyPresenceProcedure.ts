import type { StandardSchemaV1, TreatyProcedureLike } from "@pluv/types";
import { parseProcedureInput } from "./parseProcedureInput";
import { toPresenceResolverContext } from "./toPresenceResolverContext";
import type { PresenceResolverContext, TreatyResolverDoc } from "./types";

type PresenceProcedureDefs<
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
              context: PresenceResolverContext<TUser, TPresence, TJson>,
          ) => Partial<TPresence>)
        | null;
};

export class TreatyPresenceProcedure<
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TJson extends Record<string, any> = {},
    TNative extends Record<string, any> = {},
    TInput extends Record<string, any> = {},
    TFilled extends "input" | "resolve" | "" = "",
> implements TreatyProcedureLike<"presence", TInput> {
    public readonly kind = "presence" as const;

    private readonly _defs: PresenceProcedureDefs<TInput, TUser, TPresence, TJson, TNative>;

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
                          context: PresenceResolverContext<TUser, TPresence, TJson>,
                      ) => Partial<TPresence>)
                    | null
                    | undefined) ?? null,
        };
    }

    public apply(
        data: unknown,
        params: {
            doc: TreatyResolverDoc<TJson, TNative>;
            presence?: TPresence | null;
            user: TUser;
        },
    ): Partial<TPresence> {
        if (!this._defs.resolve) {
            throw new Error("Treaty presence procedure is missing resolve");
        }

        const parsed = parseProcedureInput(this._defs.input, data);

        return this._defs.resolve(parsed, toPresenceResolverContext(params));
    }

    public input<TData extends Record<string, any>>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<
        TreatyPresenceProcedure<TUser, TPresence, TJson, TNative, TData, TFilled | "input">,
        TFilled | "input"
    > {
        return new TreatyPresenceProcedure<
            TUser,
            TPresence,
            TJson,
            TNative,
            TData,
            TFilled | "input"
        >({
            input,
        }) as Omit<
            TreatyPresenceProcedure<TUser, TPresence, TJson, TNative, TData, TFilled | "input">,
            TFilled | "input"
        >;
    }

    public resolve(
        resolver: (
            data: TInput,
            context: PresenceResolverContext<TUser, TPresence, TJson>,
        ) => Partial<TPresence>,
    ): Omit<
        TreatyPresenceProcedure<
            TUser,
            TPresence,
            TJson,
            TNative,
            TInput,
            TFilled | "input" | "resolve"
        >,
        TFilled | "input" | "resolve"
    > {
        if (this._defs.resolve) throw new Error("Resolve was already defined for this procedure");

        return new TreatyPresenceProcedure<
            TUser,
            TPresence,
            TJson,
            TNative,
            TInput,
            TFilled | "input" | "resolve"
        >({
            ...this._defs,
            resolve: resolver,
        }) as Omit<
            TreatyPresenceProcedure<
                TUser,
                TPresence,
                TJson,
                TNative,
                TInput,
                TFilled | "input" | "resolve"
            >,
            TFilled | "input" | "resolve"
        >;
    }
}

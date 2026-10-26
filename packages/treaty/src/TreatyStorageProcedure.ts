import type { OperatorUser, StandardSchemaV1, TreatyProcedureLike } from "@pluv/types";
import { parseProcedureInput } from "./parseProcedureInput";
import { toStorageResolverContext } from "./toStorageResolverContext";
import { isAsyncFunction } from "./utils";
import type {
    StoragePrepareContext,
    StorageResolverContext,
    TreatyResolverDoc,
    TreatyStorageResolveOptions,
} from "./types";

declare const storageUnprepared: unique symbol;

type StorageUnprepared = typeof storageUnprepared;

type StoragePrepared<TPrepared> = [TPrepared] extends [StorageUnprepared] ? undefined : TPrepared;

type StoragePrepareFn<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TPrepared,
> = (
    data: TInput,
    context: StoragePrepareContext<TUser, TPresence>,
) => TPrepared | Promise<TPrepared>;

type StorageResolveFn<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPrepared,
> = (
    data: TInput,
    context: StorageResolverContext<TUser, TJson, TNative, TPresence>,
    prepared: StoragePrepared<TPrepared>,
) => undefined;

type StorageProcedureConfig<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPrepared,
> = {
    input?: StandardSchemaV1<unknown, TInput> | null;
    prepare?: StoragePrepareFn<TInput, TUser, TPresence, TPrepared> | null;
    resolve?: StorageResolveFn<TInput, TUser, TPresence, TJson, TNative, TPrepared> | null;
    transact?: boolean | null;
};

type StorageProcedureDefs<
    TInput extends Record<string, any>,
    TUser extends { id: string },
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPrepared,
> = {
    input: StandardSchemaV1<unknown, TInput> | null;
    prepare: StoragePrepareFn<TInput, TUser, TPresence, TPrepared> | null;
    resolve: StorageResolveFn<TInput, TUser, TPresence, TJson, TNative, TPrepared> | null;
    transact: boolean;
};

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === "object" &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === "function";

const toStoragePrepareContext = <
    TUser extends { id: string },
    TPresence extends Record<string, any>,
>(params: {
    operator?: OperatorUser | null;
    presence?: TPresence | null;
    user: TUser;
}): StoragePrepareContext<TUser, TPresence> => {
    return {
        operator: params.operator ?? null,
        presence: JSON.parse(JSON.stringify(params.presence ?? {})),
        user: params.user,
    };
};

export class TreatyStorageProcedure<
    TUser extends { id: string },
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPresence extends Record<string, any> = {},
    TInput extends Record<string, any> = {},
    TPrepared = StorageUnprepared,
    TFilled extends "input" | "prepare" | "resolve" | "" = "",
> implements TreatyProcedureLike<"storage", TInput> {
    public readonly kind = "storage" as const;

    public readonly prepared: [TPrepared] extends [StorageUnprepared] ? false : true;

    private readonly _defs: StorageProcedureDefs<
        TInput,
        TUser,
        TPresence,
        TJson,
        TNative,
        TPrepared
    >;

    public get config(): TreatyProcedureLike<"storage", TInput>["config"] {
        return this._defs;
    }

    constructor(
        config: StorageProcedureConfig<TInput, TUser, TPresence, TJson, TNative, TPrepared> = {},
    ) {
        const prepare = config.prepare ?? null;

        this.prepared = (prepare !== null) as [TPrepared] extends [StorageUnprepared]
            ? false
            : true;
        this._defs = {
            input: config.input ?? null,
            prepare,
            resolve: config.resolve ?? null,
            transact: config.transact ?? true,
        };
    }

    public async load(
        data: unknown,
        params: {
            operator?: OperatorUser | null;
            presence?: TPresence | null;
            user: TUser;
        },
    ): Promise<{ input: TInput; prepared: StoragePrepared<TPrepared> }> {
        const input = parseProcedureInput(this._defs.input, data);

        if (!this._defs.prepare)
            return { input, prepared: undefined as StoragePrepared<TPrepared> };

        return {
            input,
            prepared: (await this._defs.prepare(
                input,
                toStoragePrepareContext(params),
            )) as StoragePrepared<TPrepared>,
        };
    }

    public apply(
        data: unknown,
        params: {
            doc: TreatyResolverDoc<TJson, TNative>;
            operator?: OperatorUser | null;
            presence?: TPresence | null;
            user: TUser;
        },
        prepared?: unknown,
    ): void {
        if (!this._defs.resolve) {
            throw new Error("Treaty storage procedure is missing resolve");
        }

        if (isAsyncFunction(this._defs.resolve)) {
            throw new Error("Treaty storage procedure resolve must be synchronous");
        }

        // `load` already parsed a prepared procedure. Parsing again would rerun
        // defaults and transforms, so `resolve` would see a different value.
        const parsed = this.prepared
            ? (data as TInput)
            : parseProcedureInput(this._defs.input, data);
        const result: unknown = this._defs.resolve(
            parsed,
            toStorageResolverContext(params),
            prepared as StoragePrepared<TPrepared>,
        );

        if (isThenable(result)) {
            // `resolve` has to run before a returned promise is visible.
            // Swallow it so the rejection does not surface as unhandled.
            void Promise.resolve(result).catch(() => undefined);

            throw new Error("Treaty storage procedure resolve must be synchronous");
        }
    }

    public input<TData extends Record<string, any>>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<
        TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TData,
            TPrepared,
            TFilled | "input"
        >,
        TFilled | "input"
    > {
        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TData,
            TPrepared,
            TFilled | "input"
        >({
            input,
            prepare: this._defs.prepare as StoragePrepareFn<
                TData,
                TUser,
                TPresence,
                TPrepared
            > | null,
            transact: this._defs.transact,
        }) as Omit<
            TreatyStorageProcedure<
                TUser,
                TJson,
                TNative,
                TPresence,
                TData,
                TPrepared,
                TFilled | "input"
            >,
            TFilled | "input"
        >;
    }

    public prepare<TResult>(
        loader: StoragePrepareFn<TInput, TUser, TPresence, TResult>,
    ): Omit<
        TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TResult,
            TFilled | "prepare"
        >,
        TFilled | "prepare" | "input"
    > {
        if (this._defs.prepare) throw new Error("Prepare was already defined for this procedure");

        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TResult,
            TFilled | "prepare"
        >({
            input: this._defs.input,
            prepare: loader,
            transact: this._defs.transact,
        }) as Omit<
            TreatyStorageProcedure<
                TUser,
                TJson,
                TNative,
                TPresence,
                TInput,
                TResult,
                TFilled | "prepare"
            >,
            TFilled | "prepare" | "input"
        >;
    }

    public resolve(
        resolver: (
            data: TInput,
            context: StorageResolverContext<TUser, TJson, TNative, TPresence>,
            prepared: StoragePrepared<TPrepared>,
        ) => undefined,
        options: TreatyStorageResolveOptions = {},
    ): Omit<
        TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TPrepared,
            TFilled | "input" | "prepare" | "resolve"
        >,
        TFilled | "input" | "prepare" | "resolve"
    > {
        if (this._defs.resolve) throw new Error("Resolve was already defined for this procedure");

        return new TreatyStorageProcedure<
            TUser,
            TJson,
            TNative,
            TPresence,
            TInput,
            TPrepared,
            TFilled | "input" | "prepare" | "resolve"
        >({
            input: this._defs.input,
            prepare: this._defs.prepare,
            resolve: resolver,
            transact: options.transact ?? true,
        }) as Omit<
            TreatyStorageProcedure<
                TUser,
                TJson,
                TNative,
                TPresence,
                TInput,
                TPrepared,
                TFilled | "input" | "prepare" | "resolve"
            >,
            TFilled | "input" | "prepare" | "resolve"
        >;
    }
}

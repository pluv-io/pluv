import type { EventRecord, JsonObject, ProcedureLike, StandardSchemaV1 } from "@pluv/types";
import type { IODefs } from "./IODefs";
import type { EventResolver, EventResolverKind, MergeEventRecords } from "./types";

export interface PluvProcedureConfig<
    T extends IODefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> {
    broadcast?: EventResolver<"broadcast", T, TInput, Partial<TOutput>> | null;
    input?: StandardSchemaV1<unknown, TInput>;
    self?: EventResolver<"self", T, TInput, Partial<TOutput>> | null;
    sync?: EventResolver<"sync", T, TInput, Partial<TOutput>> | null;
}

export class PluvProcedure<
    T extends IODefs = IODefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TFilled extends "input" | "broadcast" | "self" | "sync" | "" = "",
> {
    private _broadcast: EventResolver<"broadcast", T, TInput, Partial<TOutput>> | null = null;
    private _input: StandardSchemaV1<unknown, TInput> | null = null;
    private _self: EventResolver<"self", T, TInput, Partial<TOutput>> | null = null;
    private _sync: EventResolver<"sync", T, TInput, Partial<TOutput>> | null = null;

    public get config(): ProcedureLike<TInput, TOutput>["config"] {
        return {
            broadcast: this._broadcast?.bind(this) ?? null,
            input: this._input ?? null,
            resolver: this._resolver(),
            self: this._self?.bind(this) ?? null,
            sync: this._sync?.bind(this) ?? null,
        } as ProcedureLike<TInput, TOutput>["config"];
    }

    constructor(config: PluvProcedureConfig<T, TInput, TOutput> = {}) {
        const { broadcast, input, self, sync } = config;

        this._broadcast = broadcast ?? null;
        this._input = input ?? null;
        this._self = self ?? null;
        this._sync = sync ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<"broadcast", T, TInput, TResult>,
    ): Omit<
        PluvProcedure<
            T,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "broadcast"
        >,
        TFilled | "input" | "broadcast"
    > {
        const { broadcast } = this.config;

        if (!!broadcast) throw new Error("Broadcast was already defined for this procedure");

        return new PluvProcedure<
            T,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "broadcast"
        >({
            ...(this.config as any),
            broadcast: resolver as any,
        });
    }

    public input<TData extends JsonObject>(
        input: StandardSchemaV1<unknown, TData>,
    ): Omit<PluvProcedure<T, TData, {}, TFilled | "input">, TFilled | "input"> {
        return new PluvProcedure<T, TData, {}, TFilled | "input">({
            input,
        });
    }

    public self<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<"self", T, TInput, TResult>,
    ): Omit<
        PluvProcedure<T, TInput, MergeEventRecords<[TOutput, TResult]>, TFilled | "input" | "self">,
        TFilled | "input" | "self"
    > {
        const { self } = this.config;

        if (!!self) throw new Error("Self was already defined for this procedure");

        return new PluvProcedure<
            T,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "self"
        >({
            ...(this.config as any),
            self: resolver as any,
        });
    }

    public sync<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<"sync", T, TInput, TResult>,
    ): Omit<
        PluvProcedure<T, TInput, MergeEventRecords<[TOutput, TResult]>, TFilled | "input" | "sync">,
        TFilled | "input" | "sync"
    > {
        const { sync } = this.config;

        if (!!sync) throw new Error("Sync was already defined for this procedure");

        return new PluvProcedure<
            T,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "sync"
        >({
            ...(this.config as any),
            sync: resolver as any,
        });
    }

    private _resolver(): EventResolver<EventResolverKind, T, TInput, TOutput> {
        return async (data, context) => {
            const [broadcast, self, sync] = await Promise.all([
                this._broadcast?.(data, context),
                this._self?.(data, context),
                this._sync?.(data, context),
            ]);

            return { ...broadcast, ...self, ...sync } as TOutput;
        };
    }
}

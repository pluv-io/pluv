import type { EventRecord, IOAuthorize, InputZodLike, JsonObject, ProcedureLike } from "@pluv/types";
import type { AbstractPlatform, InferRoomContextType } from "./AbstractPlatform";
import type { EventResolver, MergeEventRecords } from "./types";

export interface PluvProcedureConfig<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> {
    broadcast?: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferRoomContextType<TPlatform>,
        TInput,
        Partial<TOutput>
    > | null;
    input?: InputZodLike<TInput>;
    self?: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferRoomContextType<TPlatform>,
        TInput,
        Partial<TOutput>
    > | null;
    sync?: EventResolver<TPlatform, TAuthorize, TContext, TInput, Partial<TOutput>> | null;
}

export class PluvProcedure<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TFilled extends "input" | "broadcast" | "self" | "sync" | "" = "",
> {
    private _broadcast: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferRoomContextType<TPlatform>,
        TInput,
        Partial<TOutput>
    > | null = null;
    private _input: InputZodLike<TInput> | null = null;
    private _self: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferRoomContextType<TPlatform>,
        TInput,
        Partial<TOutput>
    > | null = null;
    private _sync: EventResolver<TPlatform, TAuthorize, TContext, TInput, Partial<TOutput>> | null = null;

    public get config(): ProcedureLike<TInput, TOutput>["config"] {
        return {
            broadcast: this._broadcast?.bind(this) ?? null,
            input: this._input ?? null,
            resolver: this._resolver(),
            self: this._self?.bind(this) ?? null,
            sync: this._sync?.bind(this) ?? null,
        } as ProcedureLike<TInput, TOutput>["config"];
    }

    constructor(config: PluvProcedureConfig<TPlatform, TAuthorize, TContext, TInput, TOutput> = {}) {
        const { broadcast, input, self, sync } = config;

        this._broadcast = broadcast ?? null;
        this._input = input ?? null;
        this._self = self ?? null;
        this._sync = sync ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<TPlatform, TAuthorize, TContext & InferRoomContextType<TPlatform>, TInput, TResult>,
    ): Omit<
        PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "broadcast"
        >,
        TFilled | "input" | "broadcast"
    > {
        const { broadcast } = this.config;

        if (!!broadcast) throw new Error("Broadcast was already defined for this procedure");

        return new PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "broadcast"
        >({
            ...(this.config as any),
            broadcast: resolver as any,
        });
    }

    public input<TData extends JsonObject>(
        input: InputZodLike<TData>,
    ): Omit<PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}, TFilled | "input">, TFilled | "input"> {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}, TFilled | "input">({ input });
    }

    public self<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<TPlatform, TAuthorize, TContext & InferRoomContextType<TPlatform>, TInput, TResult>,
    ): Omit<
        PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "self"
        >,
        TFilled | "input" | "self"
    > {
        const { self } = this.config;

        if (!!self) throw new Error("Self was already defined for this procedure");

        return new PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "self"
        >({
            ...(this.config as any),
            self: resolver as any,
        });
    }

    public sync<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<TPlatform, TAuthorize, TContext & InferRoomContextType<TPlatform>, TInput, TResult>,
    ): Omit<
        PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "sync"
        >,
        TFilled | "input" | "sync"
    > {
        const { sync } = this.config;

        if (!!sync) throw new Error("Sync was already defined for this procedure");

        return new PluvProcedure<
            TPlatform,
            TAuthorize,
            TContext,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "sync"
        >({
            ...(this.config as any),
            sync: resolver as any,
        });
    }

    private _resolver(): EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferRoomContextType<TPlatform>,
        TInput,
        TOutput
    > {
        return (data, context) => {
            return {
                ...this._broadcast?.(data, context),
                ...this._self?.(data, context),
                ...this._sync?.(data, context),
            } as TOutput;
        };
    }
}

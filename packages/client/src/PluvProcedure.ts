import type { CrdtType } from "@pluv/crdt";
import type { EventRecord, IOLike, InputZodLike, JsonObject, ProcedureLike } from "@pluv/types";
import type { EventResolver, MergeEventRecords } from "./types";

export interface PluvProcedureConfig<
    TIO extends IOLike = IOLike,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
> {
    broadcast?: EventResolver<TIO, TInput, TOutput, TPresence, TStorage> | null;
    input?: InputZodLike<TInput>;
}

export class PluvProcedure<
    TIO extends IOLike = IOLike,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TPresence extends JsonObject = {},
    TStorage extends Record<string, CrdtType<any, any>> = {},
    TFilled extends "input" | "broadcast" | "" = "",
> implements ProcedureLike<TInput, TOutput>
{
    private _broadcast: EventResolver<TIO, TInput, Partial<TOutput>, TPresence, TStorage> | null =
        null;
    private _input: InputZodLike<TInput> | null = null;

    public get config(): ProcedureLike<TInput, TOutput>["config"] {
        return {
            broadcast: this._broadcast?.bind(this) ?? null,
            input: this._input ?? null,
            resolver: this._resolver(),
        } as ProcedureLike<TInput, TOutput>["config"];
    }

    constructor(config: PluvProcedureConfig<TIO, TInput, TOutput, TPresence, TStorage> = {}) {
        const { broadcast, input } = config;

        this._broadcast = broadcast ?? null;
        this._input = input ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<TIO, TInput, TResult, TPresence, TStorage>,
    ): Omit<
        PluvProcedure<
            TIO,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TPresence,
            TStorage,
            TFilled | "input" | "broadcast"
        >,
        TFilled | "input" | "broadcast"
    > {
        const { broadcast } = this.config;

        if (!!broadcast) throw new Error("Broadcast was already defined for this procedure");

        return new PluvProcedure<
            TIO,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TPresence,
            TStorage,
            TFilled | "input" | "broadcast"
        >({
            ...(this.config as any),
            broadcast: resolver as any,
        });
    }

    public input<TData extends JsonObject>(
        input: InputZodLike<TData>,
    ): Omit<
        PluvProcedure<TIO, TData, {}, TPresence, TStorage, TFilled | "input">,
        TFilled | "input"
    > {
        return new PluvProcedure<TIO, TData, {}, TPresence, TStorage, TFilled | "input">({ input });
    }

    private _resolver(): EventResolver<TIO, TInput, TOutput, TPresence, TStorage> {
        return (data, context) => this._broadcast?.(data, context) as TOutput;
    }
}

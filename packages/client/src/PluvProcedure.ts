import type { InferDocLike } from "@pluv/crdt";
import type { EventRecord, JsonObject, ProcedureLike, StandardSchemaV1 } from "@pluv/types";
import type { ClientDefs } from "./ClientDefs";
import type { EventResolver, InferClientPresence, MergeEventRecords } from "./types";

export interface PluvProcedureConfig<
    TDefs extends ClientDefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> {
    broadcast?: EventResolver<
        TDefs["io"],
        TInput,
        TOutput,
        InferClientPresence<TDefs>,
        InferDocLike<TDefs["storage"]>
    > | null;
    input?: StandardSchemaV1<unknown, TInput>;
}

export class PluvProcedure<
    TDefs extends ClientDefs = ClientDefs,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TFilled extends "input" | "broadcast" | "" = "",
> implements ProcedureLike<TInput, TOutput> {
    private _broadcast: EventResolver<
        TDefs["io"],
        TInput,
        Partial<TOutput>,
        InferClientPresence<TDefs>,
        InferDocLike<TDefs["storage"]>
    > | null = null;
    private _input: StandardSchemaV1<unknown, TInput> | null = null;

    public get config(): ProcedureLike<TInput, TOutput>["config"] {
        return {
            broadcast: this._broadcast?.bind(this) ?? null,
            input: this._input ?? null,
        } as ProcedureLike<TInput, TOutput>["config"];
    }

    constructor(config: PluvProcedureConfig<TDefs, TInput, TOutput> = {}) {
        const { broadcast, input } = config;

        this._broadcast = broadcast ?? null;
        this._input = input ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<
            TDefs["io"],
            TInput,
            TResult,
            InferClientPresence<TDefs>,
            InferDocLike<TDefs["storage"]>
        >,
    ): Omit<
        PluvProcedure<
            TDefs,
            TInput,
            MergeEventRecords<[TOutput, TResult]>,
            TFilled | "input" | "broadcast"
        >,
        TFilled | "input" | "broadcast"
    > {
        const { broadcast } = this.config;

        if (!!broadcast) throw new Error("Broadcast was already defined for this procedure");

        return new PluvProcedure<
            TDefs,
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
    ): Omit<PluvProcedure<TDefs, TData, {}, TFilled | "input">, TFilled | "input"> {
        return new PluvProcedure<TDefs, TData, {}, TFilled | "input">({ input });
    }
}

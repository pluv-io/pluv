import type { EventRecord, IOAuthorize, InputZodLike, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferPlatformEventContextType, InferPlatformRoomContextType } from "./AbstractPlatform";
import type { EventConfig, EventResolver } from "./types";

export interface PluvProcedureConfig<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
> {
    input?: InputZodLike<TInput>;
    resolver?: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
        TInput,
        TOutput
    >;
    type?: "broadcast" | "self" | "sync";
}

export class PluvProcedure<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TOutput extends EventRecord<string, any> = {},
    TFilled extends "input" | "broadcast" | "self" | "sync" | "" = "",
> {
    private _input: InputZodLike<TInput> | null = null;
    private _resolver: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
        TInput,
        TOutput
    > | null = null;
    private _type: "broadcast" | "self" | "sync" | null = null;

    public get config(): EventConfig<TPlatform, TAuthorize, TContext, TInput, TOutput, {}, {}> | null {
        if (!this._input || !this._resolver) return null;

        return {
            input: this._input,
            resolver: this._resolver,
        };
    }

    constructor(config: PluvProcedureConfig<TPlatform, TAuthorize, TContext, TInput, TOutput> = {}) {
        const { input, resolver, type } = config;

        this._input = input ?? null;
        this._resolver = resolver ?? null;
        this._type = type ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<
            TPlatform,
            TAuthorize,
            TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
            TInput,
            TResult
        >,
    ): Omit<
        PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "broadcast">,
        TFilled | "input" | "broadcast"
    > {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "broadcast">({
            input: this._input ?? undefined,
            resolver,
            type: "broadcast",
        });
    }

    public input<TData extends JsonObject>(
        input: InputZodLike<TData>,
    ): Omit<PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}, TFilled | "input">, TFilled | "input"> {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}, TFilled | "input">({ input });
    }

    public self<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<
            TPlatform,
            TAuthorize,
            TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
            TInput,
            TResult
        >,
    ): Omit<
        PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "self">,
        TFilled | "input" | "self"
    > {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "self">({
            input: this._input ?? undefined,
            resolver,
            type: "self",
        });
    }

    public sync<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<
            TPlatform,
            TAuthorize,
            TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
            TInput,
            TResult
        >,
    ): Omit<
        PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "sync">,
        TFilled | "input" | "sync"
    > {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult, TFilled | "input" | "sync">({
            input: this._input ?? undefined,
            resolver,
            type: "sync",
        });
    }
}

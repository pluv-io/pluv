import type { EventRecord, IOAuthorize, InputZodLike, JsonObject } from "@pluv/types";
import type { AbstractPlatform, InferPlatformEventContextType, InferPlatformRoomContextType } from "./AbstractPlatform";
import type { EventConfig, EventResolver } from "./types";

export interface PluvProcedureConfig<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
> {
    input?: InputZodLike<TInput>;
    resolver?: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
        TInput,
        TResultBroadcast
    >;
}

export class PluvProcedure<
    TPlatform extends AbstractPlatform<any>,
    TAuthorize extends IOAuthorize<any, any, InferPlatformRoomContextType<TPlatform>>,
    TContext extends JsonObject,
    TInput extends JsonObject = {},
    TResultBroadcast extends EventRecord<string, any> = {},
> {
    private _input: InputZodLike<TInput> | null = null;
    private _resolver: EventResolver<
        TPlatform,
        TAuthorize,
        TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
        TInput,
        TResultBroadcast
    > | null = null;

    public get config(): EventConfig<TPlatform, TAuthorize, TContext, TInput, TResultBroadcast, {}, {}> | null {
        if (!this._input || !this._resolver) return null;

        return {
            input: this._input,
            resolver: this._resolver,
        };
    }

    constructor(config: PluvProcedureConfig<TPlatform, TAuthorize, TContext, TInput, TResultBroadcast> = {}) {
        const { input, resolver } = config;

        this._input = input ?? null;
        this._resolver = resolver ?? null;
    }

    public broadcast<TResult extends EventRecord<string, any> = {}>(
        resolver: EventResolver<
            TPlatform,
            TAuthorize,
            TContext & InferPlatformRoomContextType<TPlatform> & InferPlatformEventContextType<TPlatform>,
            TInput,
            TResult
        >,
    ) {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TInput, TResult>({
            input: this._input ?? undefined,
            resolver,
        });
    }

    public input<TData extends JsonObject>(
        input: InputZodLike<TData>,
    ): PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}> {
        return new PluvProcedure<TPlatform, TAuthorize, TContext, TData, {}>({ input });
    }
}

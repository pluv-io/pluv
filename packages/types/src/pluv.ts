import { Id, JsonObject, MaybePromise, NonNilProps } from "./general";

export type BaseUser = {
    id: string;
};

export interface BaseClientEventRecord {
    $GET_OTHERS: {};
    $PING: {};
    $UPDATE_PRESENCE: {
        presence: JsonObject;
    };
    $UPDATE_STORAGE: {
        origin: string | null;
        update: string;
    };
}

export type BaseClientMessage = InferEventMessage<BaseClientEventRecord>;

export interface BaseIOAuthorize {
    required: false;
    secret: string;
    user: InputZodLike<BaseUser>;
}

export interface BaseIOAuthorizeEventRecord<
    TAuthorize extends IOAuthorize<any, any>
> {
    $OTHERS_RECEIVED: {
        others: {
            [connectionId: string]: {
                connectionId: string;
                presence: JsonObject | null;
                room: string | null;
                user: InferIOAuthorizeUser<TAuthorize>;
            };
        };
    };
    $USER_JOINED: {
        connectionId: string;
        user: NonNullable<InferIOAuthorizeUser<TAuthorize>>;
    };
}

export type BaseIOEventRecord<TAuthorize extends IOAuthorize<any, any>> =
    BaseIOAuthorizeEventRecord<TAuthorize> & {
        $ERROR: {
            message: string;
            stack?: string | null;
        };
        $EXIT: {
            sessionId: string;
        };
        $PONG: {};
        $PRESENCE_UPDATED: {
            presence: JsonObject;
        };
        $REGISTERED: {
            sessionId: string;
        };
        $STORAGE_RECEIVED: {
            state: string;
        };
        $STORAGE_UPDATED: {
            state: string;
        };
    };

export interface EventMessage<
    TEvent extends string,
    TData extends JsonObject = {}
> {
    data: TData;
    type: TEvent;
}

export type EventRecord<TEvent extends string, TData extends JsonObject> = {
    [key in `${TEvent}`]: TData;
};

export type GetEventMessage<
    T extends EventRecord<string, any>,
    TEvent extends keyof T
> = TEvent extends string ? EventMessage<TEvent, T[TEvent]> : never;

export type InferEventMessage<
    TEvents extends EventRecord<string, any> = EventRecord<string, any>,
    TEvent extends keyof TEvents = keyof TEvents
> = {
    [P in TEvent]: P extends string ? Id<EventMessage<P, TEvents[P]>> : never;
}[TEvent];

export type InferIOAuthorize<TIO extends IOLike> = TIO extends IOLike<
    infer IAuthorize
>
    ? IAuthorize
    : never;

export type InferIOAuthorizeRequired<TAuthorize extends IOAuthorize<any, any>> =
    TAuthorize extends IOAuthorize<any, infer IRequired> ? IRequired : never;

export type InferIOAuthorizeUser<TAuthorize extends IOAuthorize<any, any>> =
    TAuthorize extends IOAuthorize<infer IUser, infer IRequired>
        ? IRequired extends true
            ? IUser
            : IUser | null
        : never;

export type InferIOInput<TIO extends IOLike> = TIO extends IOLike<
    any,
    infer IInput
>
    ? IInput
    : never;

export type InferIOOutput<TIO extends IOLike> = TIO extends IOLike<
    any,
    any,
    infer IOutput
>
    ? IOutput
    : never;

export type InputZodLike<TData extends JsonObject> = {
    _input: TData;
    parse: (data: unknown) => TData;
};

export interface IOAuthorize<
    TUser extends BaseUser = any,
    TRequired extends boolean = false
> {
    required: TRequired;
    secret: string;
    user: InputZodLike<TUser>;
}

export type IOAuthorizeEventMessage<TIO extends IOLike> =
    InferIOAuthorizeRequired<InferIOAuthorize<TIO>> extends false
        ? IOAuthorizeOptionalEventMessage<TIO>
        : IOAuthorizeRequiredEventMessage<TIO>;

export interface IOAuthorizeOptionalEventMessage<TIO extends IOLike> {
    connectionId: string | null;
    user: InferIOAuthorizeUser<InferIOAuthorize<TIO>> | null;
}

export type IOAuthorizeRequiredEventMessage<TIO extends IOLike> = NonNilProps<
    IOAuthorizeOptionalEventMessage<TIO>,
    "connectionId" | "user"
>;

export type IOEventMessage<
    TIO extends IOLike,
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>
> = Id<
    { room: string } & InferEventMessage<InferIOOutput<TIO>, TEvent> &
        (InferEventMessage<InferIOOutput<TIO>, TEvent>["type"] extends "$ERROR"
            ? IOAuthorizeOptionalEventMessage<TIO>
            : IOAuthorizeEventMessage<TIO>)
>;

export interface IOLike<
    TAuthorize extends IOAuthorize<any, any> = IOAuthorize<any, any>,
    TInput extends EventRecord<string, any> = {},
    TOutput extends EventRecord<string, any> = {}
> {
    _authorize: TAuthorize | null;
    _events: {
        [P in keyof TInput]: P extends string
            ? {
                  resolver: (
                      data: TInput[P],
                      ...args: any[]
                  ) => MaybePromise<TOutput | void>;
              }
            : never;
    };
}

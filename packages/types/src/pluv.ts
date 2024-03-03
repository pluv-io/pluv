import { Id, JsonObject, MaybePromise, NonNilProps, Spread } from "./general";

export type BaseUser = {
    id: string;
};

export interface BaseClientEventRecord {
    $GET_OTHERS: {};
    $INITIALIZE_SESSION: {
        presence: JsonObject;
        update: string | null;
    };
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
    TAuthorize extends IOAuthorize<any, any, any>,
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
        presence: JsonObject;
    };
}

export type BaseIOEventRecord<TAuthorize extends IOAuthorize<any, any, any>> =
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
    TData extends JsonObject = {},
> {
    data: TData;
    type: TEvent;
}

export type EventRecord<TEvent extends string, TData extends JsonObject> = {
    [key in `${TEvent}`]: TData;
};

export type GetEventMessage<
    T extends EventRecord<string, any>,
    TEvent extends keyof T,
> = TEvent extends string ? EventMessage<TEvent, T[TEvent]> : never;

export type InferEventMessage<
    TEvents extends EventRecord<string, any> = EventRecord<string, any>,
    TEvent extends keyof TEvents = keyof TEvents,
> = {
    [P in TEvent]: P extends string ? Id<EventMessage<P, TEvents[P]>> : never;
}[TEvent];

export type InferIOAuthorize<TIO extends IOLike> =
    TIO extends IOLike<infer IAuthorize> ? IAuthorize : never;

export type InferIOAuthorizeRequired<
    TAuthorize extends IOAuthorize<any, any, any>,
> = TAuthorize extends IOAuthorize<any, infer IRequired> ? IRequired : never;

export type InferIOAuthorizeUser<
    TAuthorize extends IOAuthorize<any, any, any>,
> =
    TAuthorize extends IOAuthorize<infer IUser, infer IRequired>
        ? IRequired extends true
            ? IUser
            : IUser | null
        : never;

export type InferIOInput<TIO extends IOLike> =
    TIO extends IOLike<any, infer IInput> ? IInput : never;

export type InferIOOutput<TIO extends IOLike> =
    TIO extends IOLike<
        any,
        any,
        infer IOutputBroadcast,
        infer IOutputSelf,
        infer IOutputSync
    >
        ? Spread<[IOutputBroadcast, IOutputSelf, IOutputSync]>
        : never;

export type InferIOOutputBroadcast<TIO extends IOLike> =
    TIO extends IOLike<any, any, infer IOutput> ? IOutput : never;

export type InferIOOutputSelf<TIO extends IOLike> =
    TIO extends IOLike<any, any, any, infer IOutput> ? IOutput : never;

export type InferIOOutputSync<TIO extends IOLike> =
    TIO extends IOLike<any, any, any, any, infer IOutput> ? IOutput : never;

export type InputZodLike<TData extends JsonObject> = {
    _input: TData;
    parse: (data: unknown) => TData;
};

export type IOAuthorize<
    TUser extends BaseUser = any,
    TRequired extends boolean = false,
    TContext extends Record<string, unknown> = {},
> =
    | {
          required: TRequired;
          secret: string;
          user: InputZodLike<TUser>;
      }
    | ((context: TContext) => {
          required: TRequired;
          secret: string;
          user: InputZodLike<TUser>;
      });

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
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>,
> = Id<
    { room: string } & InferEventMessage<InferIOOutput<TIO>, TEvent> &
        (InferEventMessage<InferIOOutput<TIO>, TEvent>["type"] extends "$ERROR"
            ? IOAuthorizeOptionalEventMessage<TIO>
            : IOAuthorizeEventMessage<TIO>)
>;

export interface IOLike<
    TAuthorize extends IOAuthorize<any, any, any> = IOAuthorize<any, any, any>,
    TInput extends EventRecord<string, any> = {},
    TOutputBroadcast extends EventRecord<string, any> = {},
    TOutputSelf extends EventRecord<string, any> = {},
    TOutputSync extends EventRecord<string, any> = {},
> {
    _authorize: TAuthorize | null;
    _events: {
        [P in keyof TInput]: P extends string
            ? {
                  resolver:
                      | ((
                            data: TInput[P],
                            ...args: any[]
                        ) => MaybePromise<TOutputBroadcast | void>)
                      | {
                            broadcast?: (
                                data: TInput[P],
                                ...args: any[]
                            ) => MaybePromise<TOutputBroadcast | void>;
                            self?: (
                                data: TInput[P],
                                ...args: any[]
                            ) => MaybePromise<TOutputSelf | void>;
                            sync?: (
                                data: TInput[P],
                                ...args: any[]
                            ) => MaybePromise<TOutputSync | void>;
                        };
              }
            : never;
    };
}

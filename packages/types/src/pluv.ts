import type { Id, JsonObject, MaybePromise, NonNilProps, UnionToIntersection } from "./general";

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

export interface BaseIOAuthorizeEventRecord<TAuthorize extends IOAuthorize<any, any>> {
    $OTHERS_RECEIVED: {
        others: {
            [connectionId: string]: {
                connectionId: string;
                presence: JsonObject | null;
                room: string | null;
                user: Id<InferIOAuthorizeUser<TAuthorize>>;
            };
        };
    };
    $USER_JOINED: {
        connectionId: string;
        user: NonNullable<Id<InferIOAuthorizeUser<TAuthorize>>>;
        presence: JsonObject;
    };
}

export type BaseIOEventRecord<TAuthorize extends IOAuthorize<any, any>> = BaseIOAuthorizeEventRecord<TAuthorize> & {
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

export interface EventMessage<TEvent extends string, TData extends JsonObject = {}> {
    data: TData;
    type: TEvent;
}

export type EventRecord<TEvent extends string, TData extends JsonObject> = {
    [key in `${TEvent}`]: TData;
};

export type GetEventMessage<T extends EventRecord<string, any>, TEvent extends keyof T> = TEvent extends string
    ? EventMessage<TEvent, T[TEvent]>
    : never;

export type InferIOAuthorize<TIO extends IOLike<any, any>> = TIO extends IOLike<infer IAuthorize> ? IAuthorize : never;

export type InferIOAuthorizeUser<TAuthorize extends IOAuthorize<any, any> | null> =
    TAuthorize extends IOAuthorize<infer IUser, any> ? IUser : null;

export type InputZodLike<TData extends JsonObject> = {
    _input: TData;
    parse: (data: unknown) => TData;
};

export type IOAuthorize<TUser extends BaseUser | null = any, TContext extends Record<string, unknown> = {}> =
    | (TUser extends BaseUser
          ? {
                secret?: string;
                user: InputZodLike<TUser>;
            }
          : null)
    | ((context: TContext) => TUser extends BaseUser
          ? {
                secret?: string;
                user: TUser extends BaseUser ? InputZodLike<TUser> : null;
            }
          : null);

export type IOAuthorizeEventMessage<TIO extends IOLike> = {
    connectionId: string;
    user: InferIOAuthorizeUser<InferIOAuthorize<TIO>>;
};

export type ProcedureLike<TInput extends JsonObject = {}, TOutput extends EventRecord<string, any> = {}> = {
    config: {
        broadcast?: ((data: TInput, ...args: any[]) => MaybePromise<Partial<TOutput> | void>) | null;
        input?: InputZodLike<TInput> | null;
        resolver: (data: TInput, ...args: any[]) => MaybePromise<TOutput>;
        self?: ((data: TInput, ...args: any[]) => MaybePromise<Partial<TOutput> | void>) | null;
        sync?: ((data: TInput, ...args: any[]) => MaybePromise<Partial<TOutput> | void>) | null;
    };
};

export interface IORouterLike<TEvents extends Record<string, ProcedureLike<any, any>> = {}> {
    _defs: {
        events: TEvents;
    };
}

export interface IOLike<
    TAuthorize extends IOAuthorize<any, any> | null = null,
    TEvents extends Record<string, ProcedureLike<any, any>> = {},
> extends IORouterLike<TEvents> {
    _defs: {
        authorize: TAuthorize;
        events: TEvents;
    };
}

export type InferEventsInput<TEvents extends Record<string, ProcedureLike<any, any>>> = {
    [P in keyof TEvents]: TEvents[P] extends ProcedureLike<infer IInput, any> ? IInput : never;
};

export type InferEventsOutput<TEvents extends Record<string, ProcedureLike<any, any>>> = UnionToIntersection<
    {
        [P in keyof TEvents]: TEvents[P] extends ProcedureLike<any, infer IOutput> ? IOutput : never;
    }[keyof TEvents]
>;

export type InferIOInput<TRouter extends IORouterLike<any>> =
    TRouter extends IORouterLike<infer IEvents> ? InferEventsInput<IEvents> : never;

export type InferIOOutput<TRouter extends IORouterLike<any>> =
    TRouter extends IORouterLike<infer IEvents> ? InferEventsOutput<IEvents> : never;

export type InferEventMessage<TEvents = EventRecord<string, any>, TEvent extends keyof TEvents = keyof TEvents> =
    TEvents extends EventRecord<string, any>
        ? { [P in TEvent]: P extends string ? Id<EventMessage<P, TEvents[P]>> : never }[TEvent]
        : never;

export type IOEventMessage<
    TIO extends IOLike<any>,
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>,
> = Id<
    { room: string } & InferEventMessage<InferIOOutput<TIO>, TEvent> &
        (InferEventMessage<InferIOOutput<TIO>, TEvent>["type"] extends "$ERROR"
            ? Partial<IOAuthorizeEventMessage<TIO>>
            : IOAuthorizeEventMessage<TIO>)
>;

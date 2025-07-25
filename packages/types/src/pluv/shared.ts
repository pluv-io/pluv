import type { Id, JsonObject, MaybePromise, UnionToIntersection } from "../general";
import { CrdtLibraryType } from "./crdt";

export type BaseUser = {
    id: string;
};

export interface BaseClientEventRecord {
    $getOthers: {};
    $initializeSession: {
        presence: JsonObject;
        update: string | null;
    };
    $ping: {};
    $updatePresence: {
        presence: JsonObject;
    };
    $updateStorage: {
        origin: string | null;
        update: string;
    };
}

export type BaseClientMessage = InferEventMessage<BaseClientEventRecord>;

export type BaseIOEventRecord<TAuthorize extends IOAuthorize<any, any>> = {
    $error: {
        message: string;
        stack?: string | null;
    };
    $exit: {
        sessionId: string;
    };
    $othersReceived: {
        others: {
            [connectionId: string]: {
                connectionId: string;
                presence: JsonObject | null;
                room: string | null;
                timers: { presence: number | null };
                user: Id<InferIOAuthorizeUser<TAuthorize>>;
            };
        };
    };
    $pong: {};
    $presenceUpdated: {
        presence: JsonObject;
        timers: { presence: number | null };
    };
    $registered: {
        presence: JsonObject | null;
        sessionId: string;
        state: string | null;
        timers: { presence: number | null };
    };
    $storageReceived: {
        changeKind: "empty" | "initialized" | "unchanged";
        state: string;
    };
    $storageUpdated: {
        state: string;
    };
    $syncStateReceived: {
        connectionIds: readonly string[];
    };
    $userJoined: {
        connectionId: string;
        presence: JsonObject;
        timers: { presence: number | null };
        user: NonNullable<Id<InferIOAuthorizeUser<TAuthorize>>>;
    };
};

export interface EventMessage<TEvent extends string, TData extends JsonObject = {}> {
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

export type InferIOAuthorize<TIO extends IOLike<any, any, any>> =
    TIO extends IOLike<infer IAuthorize, any, any>
        ? InferIOAuthorizeUser<IAuthorize> extends BaseUser
            ? { user: InputZodLike<InferIOAuthorizeUser<IAuthorize>> }
            : null
        : never;

export type InferIOAuthorizeUser<TAuthorize extends IOAuthorize<any, any> | null> =
    TAuthorize extends IOAuthorize<infer IUser, any> ? IUser : null;

export type InputZodLike<TData extends JsonObject> = {
    parse: (data: unknown) => TData;
} & ({ _input: TData } | { _zod: { input: TData } });

export type IOAuthorize<
    TUser extends BaseUser | null = any,
    TContext extends Record<string, unknown> = {},
> =
    | (TUser extends BaseUser
          ? {
                secret?: string;
                user: InputZodLike<TUser>;
            }
          : null)
    | ((context: TContext) => TUser extends BaseUser
          ? {
                secret?: string;
                user: InputZodLike<TUser>;
            }
          : null);

export type IOAuthorizeEventMessage<TIO extends IOLike> = {
    connectionId: string;
    user: InferIOAuthorizeUser<InferIOAuthorize<TIO>>;
};

export type ProcedureLike<
    TInput extends Record<string, any> = {},
    TOutput extends EventRecord<string, any> = {},
> = {
    config: {
        broadcast?:
            | ((data: TInput, ...args: any[]) => MaybePromise<Partial<TOutput> | void>)
            | null;
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
    TCrdt extends CrdtLibraryType<any> = CrdtLibraryType<any>,
    TEvents extends Record<string, ProcedureLike<any, any>> = {},
> extends IORouterLike<TEvents> {
    _defs: {
        authorize: TAuthorize;
        crdt: TCrdt;
        events: TEvents;
    };
}

export type InferIOCrdtKind<TIO extends IOLike<any, any, any>> =
    TIO extends IOLike<any, infer ICrdt, any>
        ? ICrdt extends CrdtLibraryType<infer IDoc>
            ? IDoc
            : never
        : never;

export type InferIOCrdt<TIO extends IOLike<any, any, any>> =
    TIO extends IOLike<any, infer ICrdt, any> ? ICrdt : never;

export type InferIOEvents<TIO extends IOLike<any, any, any>> =
    TIO extends IOLike<any, any, infer IEvents>
        ? {
              [P in keyof IEvents]: ProcedureLike<
                  InferIOProcedureInput<IEvents[P]>,
                  InferIOProcedureOutput<IEvents[P]>
              >;
          }
        : never;

export type InferIOProcedureInput<TProcedure extends ProcedureLike<any, any>> =
    TProcedure extends ProcedureLike<infer IInput, any> ? Id<IInput> : never;

export type InferIOProcedureOutput<TProcedure extends ProcedureLike<any, any>> =
    TProcedure extends ProcedureLike<any, infer IOutput> ? Id<IOutput> : never;

export type InferEventsInput<TEvents extends Record<string, ProcedureLike<any, any>>> = {
    [P in keyof TEvents]: TEvents[P] extends ProcedureLike<infer IInput, any> ? Id<IInput> : never;
};

export type InferEventsOutput<TEvents extends Record<string, ProcedureLike<any, any>>> =
    UnionToIntersection<
        {
            [P in keyof TEvents]: TEvents[P] extends ProcedureLike<any, infer IOutput>
                ? Id<IOutput>
                : never;
        }[keyof TEvents]
    >;

export type InferIOInput<TRouter extends IORouterLike<any>> =
    TRouter extends IORouterLike<infer IEvents> ? InferEventsInput<IEvents> : never;

export type InferIOOutput<TRouter extends IORouterLike<any>> =
    TRouter extends IORouterLike<infer IEvents> ? InferEventsOutput<IEvents> : never;

export type InferEventMessage<
    TEvents = EventRecord<string, any>,
    TEvent extends keyof TEvents = keyof TEvents,
> =
    TEvents extends EventRecord<string, any>
        ? { [P in TEvent]: P extends string ? Id<EventMessage<P, TEvents[P]>> : never }[TEvent]
        : never;

export type IOEventMessage<
    TIO extends IOLike<any, any, any>,
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>,
> = Id<
    { room: string } & InferEventMessage<InferIOOutput<TIO>, TEvent> &
        (InferEventMessage<InferIOOutput<TIO>, TEvent>["type"] extends "$error"
            ? Partial<IOAuthorizeEventMessage<TIO>>
            : IOAuthorizeEventMessage<TIO>)
>;

export type PluvRouterEventConfig = { [P: string]: Pick<ProcedureLike<any, any>, "config"> };

export type MergeEvents<
    TClientEvents extends PluvRouterEventConfig,
    TServerIO extends IOLike<any, any, any>,
> =
    TServerIO extends IOLike<infer IAuthorize, infer ICrdt, infer IServerEvents>
        ? IOLike<
              IAuthorize,
              ICrdt,
              {
                  [P in keyof TClientEvents]: TClientEvents[P] extends ProcedureLike<
                      infer IClientInput,
                      infer IClientOutput
                  >
                      ? {
                            [K in keyof IClientOutput]: K extends keyof IServerEvents
                                ? IServerEvents[K]
                                : ProcedureLike<IClientInput, Id<Pick<IClientOutput, K>>>;
                        }[keyof IClientOutput]
                      : never;
              } & IServerEvents
          >
        : never;

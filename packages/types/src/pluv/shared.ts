import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Id, IsAny, JsonObject, MaybePromise, UnionToIntersection } from "../general";
import { CrdtLibraryType } from "./crdt";

export type BaseUser = {
    id: string;
};

export interface BaseClientEventRecord {
    $getOthers: {};
    $initializeSession: {
        presence: JsonObject | null;
        update: string | null;
    };
    $listUsers: {
        cursor?: string | null;
        limit?: number;
        requestId: string;
    };
    $ping: {};
    $updatePresence: {
        presence: JsonObject | null;
    };
    $updateStorage: {
        origin: string | null;
        update: string | null;
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
        user: Id<InferIOAuthorizeUser<TAuthorize>>;
    };
    $othersReceived: {
        myConnectionIds: string[];
        others: {
            connectionIds: string[];
            data: Id<InferIOAuthorizeUser<TAuthorize>>;
            presence: JsonObject | null;
            timers: { presence: number | null };
        }[];
    };
    $pong: {};
    $roomStats: {
        connectionCount: number;
        userCount: number;
    };
    $presenceUpdated: {
        presence: JsonObject;
        timers: { presence: number | null };
        user: Id<InferIOAuthorizeUser<TAuthorize>>;
    };
    $registered: {
        connectionCount: number;
        presence: JsonObject | null;
        sessionId: string;
        state: string | null;
        timers: { presence: number | null };
        userCount: number;
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
        user: Id<InferIOAuthorizeUser<TAuthorize>>;
    };
    $usersPage:
        | {
              requestId: string;
              success: true;
              pageInfo: {
                  endCursor: string | null;
                  hasNextPage: boolean;
              };
              users: {
                  data: Id<InferIOAuthorizeUser<TAuthorize>>;
              }[];
          }
        | {
              requestId: string;
              success: false;
              error: {
                  code: "FAILED" | "INVALID_LIMIT";
                  message: string;
              };
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

export type InferIOAuthorize<TIO extends IOLike> =
    TIO extends IOLike<infer D>
        ? IsAny<D> extends true
            ? { user: StandardSchemaV1<unknown, any> }
            : { user: StandardSchemaV1<unknown, InferIOAuthorizeUser<D["authorize"]>> }
        : never;

export type InferIOAuthorizeUser<TAuthorize extends IOAuthorize<any, any>> =
    IsAny<TAuthorize> extends true
        ? any
        : TAuthorize extends IOAuthorize<infer IUser, any>
          ? IUser
          : never;

export type IOAuthorize<
    TUser extends BaseUser = any,
    TContext extends Record<string, unknown> = {},
> =
    | {
          secret?: string;
          user: StandardSchemaV1<unknown, TUser>;
      }
    | ((context: TContext) => {
          secret?: string;
          user: StandardSchemaV1<unknown, TUser>;
      });

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
        input?: StandardSchemaV1<unknown, TInput> | null;
        self?: ((data: TInput, ...args: any[]) => MaybePromise<Partial<TOutput> | void>) | null;
    };
};

export interface IORouterLike<TEvents extends Record<string, ProcedureLike<any, any>> = {}> {
    _defs: {
        events: TEvents;
    };
}

export type IOLikeDefs = {
    authorize: IOAuthorize<any, any>;
    crdt: CrdtLibraryType<any>;
    events: Record<string, ProcedureLike<any, any>>;
};

export interface IOLike<T extends IOLikeDefs = any> extends IORouterLike<T["events"]> {
    _defs: T;
}

export type InferIOCrdtKind<TIO extends IOLike> =
    TIO extends IOLike<infer D>
        ? IsAny<D> extends true
            ? any
            : D["crdt"] extends CrdtLibraryType<infer IDoc>
              ? IDoc
              : never
        : never;

export type InferIOCrdt<TIO extends IOLike> =
    TIO extends IOLike<infer D> ? (IsAny<D> extends true ? any : D["crdt"]) : never;

export type InferIOEvents<TIO extends IOLike> =
    TIO extends IOLike<infer D>
        ? IsAny<D> extends true
            ? any
            : {
                  [P in keyof D["events"]]: ProcedureLike<
                      InferIOProcedureInput<D["events"][P]>,
                      InferIOProcedureOutput<D["events"][P]>
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

export type ServerOriginEvent = "$error" | "$roomStats" | "$syncStateReceived";

export type IOEventMessage<
    TIO extends IOLike,
    TEvent extends keyof InferIOOutput<TIO> = keyof InferIOOutput<TIO>,
> = Id<
    { room: string } & InferEventMessage<InferIOOutput<TIO>, TEvent> &
        (InferEventMessage<InferIOOutput<TIO>, TEvent>["type"] extends ServerOriginEvent
            ? {
                  connectionId?: string | null;
                  user?: InferIOAuthorizeUser<InferIOAuthorize<TIO>> | null;
              }
            : IOAuthorizeEventMessage<TIO>)
>;

export type PluvRouterEventConfig = { [P: string]: Pick<ProcedureLike<any, any>, "config"> };

export type MergeEvents<TClientEvents extends PluvRouterEventConfig, TServerIO extends IOLike> =
    TServerIO extends IOLike<infer D>
        ? IsAny<D> extends true
            ? TServerIO
            : IOLike<{
                  authorize: D["authorize"];
                  crdt: D["crdt"];
                  events: {
                      [P in keyof TClientEvents]: TClientEvents[P] extends ProcedureLike<
                          infer IClientInput,
                          infer IClientOutput
                      >
                          ? {
                                [K in keyof IClientOutput]: K extends keyof D["events"]
                                    ? D["events"][K]
                                    : ProcedureLike<IClientInput, Id<Pick<IClientOutput, K>>>;
                            }[keyof IClientOutput]
                          : never;
                  } & D["events"];
              }>
        : never;

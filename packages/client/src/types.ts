import type {
    CrdtDocLike,
    EventRecord,
    Id,
    InferEventsInput,
    InferEventsOutput,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutput,
    IOLike,
    JsonObject,
    MaybePromise,
    StandardSchemaV1,
    UserInfo,
} from "@pluv/types";
import type { ClientDefs } from "./ClientDefs";
import type { PluvClient } from "./PluvClient";

export type InferSchemaInput<TSchema, TFallback extends Record<string, any> = {}> =
    TSchema extends StandardSchemaV1<infer I extends Record<string, any>, any> ? I : TFallback;

export type InferSchemaOutput<TSchema, TFallback extends Record<string, any> = {}> =
    TSchema extends StandardSchemaV1<any, infer O extends Record<string, any>> ? O : TFallback;

export type InferClientPresence<TDefs extends ClientDefs> = InferSchemaOutput<TDefs["presence"]>;
export type InferClientMetadata<TDefs extends ClientDefs> = InferSchemaOutput<TDefs["metadata"]>;
export type InferClientInput<TDefs extends ClientDefs> = InferEventsInput<TDefs["events"]> &
    InferIOInput<TDefs["io"]>;
export type InferClientOutput<TDefs extends ClientDefs> = InferEventsOutput<TDefs["events"]> &
    InferIOOutput<TDefs["io"]>;

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>> | null;
}

export type EventResolver<
    TIO extends IOLike,
    TInput extends JsonObject,
    TOutput extends EventRecord<string, any>,
    TPresence extends Record<string, any>,
    TDocLike extends CrdtDocLike<any, any>,
> = (
    data: TInput,
    context: EventResolverContext<TIO, TPresence, TDocLike>,
) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TIO extends IOLike,
    TPresence extends Record<string, any>,
    TDocLike extends CrdtDocLike<any, any>,
> {
    doc: TDocLike;
    others: readonly UserInfo<TIO, TPresence>[];
    room: string;
    user: UserInfo<TIO, TPresence>;
}

export type InferMetadata<TClient extends PluvClient<any>> =
    TClient extends PluvClient<infer TDefs> ? InferSchemaOutput<TDefs["metadata"]> : never;

export interface InternalSubscriptions {
    observeCrdt: (() => void) | null;
}

export type MergeEventRecords<
    TEventRecords extends EventRecord<string, any>[],
    TRoot extends EventRecord<string, any> = {},
> = TEventRecords extends [
    infer IHead extends EventRecord<string, any>,
    ...infer ITail extends EventRecord<string, any>[],
]
    ? MergeEventRecords<
          ITail,
          Omit<TRoot, keyof IHead> & {
              [P in keyof IHead]: TRoot extends Record<P, any> ? TRoot[P] | IHead[P] : IHead[P];
          }
      >
    : Id<TRoot>;

export interface PluvClientLimits {
    /**
     * @description Maximum size of presence object in bytes
     */
    presenceMaxSize?: number | null;
}

export interface PublicKeyParams<TMetadata extends Record<string, any>> {
    metadata: TMetadata;
}
export type PublicKey<TMetadata extends Record<string, any>> =
    | string
    | ((params: PublicKeyParams<TMetadata>) => string);

export type WithMetadata<TMetadata extends Record<string, any> = {}> = keyof TMetadata extends never
    ? { metadata?: undefined }
    : { metadata: TMetadata };

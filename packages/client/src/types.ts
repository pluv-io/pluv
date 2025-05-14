import type { CrdtType } from "@pluv/crdt";
import type {
    CrdtDocLike,
    EventRecord,
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    IOLike,
    JsonObject,
    MaybePromise,
    UserInfo,
} from "@pluv/types";
import type { PluvClient } from "./PluvClient";

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>> | null;
}

export type EventResolver<
    TIO extends IOLike,
    TInput extends JsonObject,
    TOutput extends EventRecord<string, any>,
    TPresence extends JsonObject,
    TDocLike extends CrdtDocLike<any, any>,
> = (
    data: TInput,
    context: EventResolverContext<TIO, TPresence, TDocLike>,
) => MaybePromise<TOutput | void>;

export interface EventResolverContext<
    TIO extends IOLike,
    TPresence extends JsonObject,
    TDocLike extends CrdtDocLike<any, any>,
> {
    doc: TDocLike;
    others: readonly UserInfo<TIO, TPresence>[];
    room: string;
    user: UserInfo<TIO, TPresence>;
}

export type InferMetadata<TClient extends PluvClient<any, any, any, any>> =
    TClient extends PluvClient<any, any, any, infer IMetadata> ? IMetadata : never;

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

export interface PublicKeyParams<TMetadata extends JsonObject> {
    metadata: TMetadata;
}
export type PublicKey<TMetadata extends JsonObject> =
    | string
    | ((params: PublicKeyParams<TMetadata>) => string);

export type WithMetadata<TMetadata extends JsonObject = {}> = keyof TMetadata extends never
    ? { metadata?: undefined }
    : { metadata: TMetadata };

import type {
    Id,
    InferIOAuthorize,
    InferIOAuthorizeUser,
    InferIOInput,
    InferIOOutput,
    IOLike,
    OperatorUser,
    ParticipantKind,
    StandardSchemaV1,
} from "@pluv/types";
import type { ClientDefs } from "./ClientDefs";

export type InferSchemaInput<TSchema, TFallback extends Record<string, any> = {}> =
    TSchema extends StandardSchemaV1<infer I extends Record<string, any>, any> ? I : TFallback;

export type InferSchemaOutput<TSchema, TFallback extends Record<string, any> = {}> =
    TSchema extends StandardSchemaV1<any, infer O extends Record<string, any>> ? O : TFallback;

export type InferClientPresence<TDefs extends ClientDefs> = InferSchemaOutput<TDefs["presence"]>;
export type InferClientMetadata<TDefs extends ClientDefs> = InferSchemaOutput<TDefs["metadata"]>;
export type InferClientInput<TDefs extends ClientDefs> = InferIOInput<TDefs["io"]>;
export type InferClientOutput<TDefs extends ClientDefs> = InferIOOutput<TDefs["io"]>;

export interface AuthorizationState<TIO extends IOLike> {
    token: string | null;
    user: Id<InferIOAuthorizeUser<InferIOAuthorize<TIO>>> | null;
    kind: ParticipantKind;
    operator: OperatorUser | null;
}

export interface InternalSubscriptions {
    observeCrdt: (() => void) | null;
}

export interface PluvClientLimits {
    /**
     * @description Maximum size of presence object in bytes
     */
    presenceMaxSize?: number | null;
}

export type WithMetadata<TMetadata extends Record<string, any> = {}> = keyof TMetadata extends never
    ? { metadata?: undefined }
    : { metadata: TMetadata };

import type { AbstractCrdtDocFactory, InferJson, InferStorage } from "@pluv/crdt";
import type { BaseUser, DeepReadonly, StandardSchemaV1 } from "@pluv/types";

export type TreatyUserSchema<TUser extends BaseUser = BaseUser> = StandardSchemaV1<unknown, TUser>;

export type TreatyPresenceSchema<TPresence extends Record<string, any> = Record<string, any>> =
    StandardSchemaV1<unknown, TPresence>;

export type TreatyStorageSchema = AbstractCrdtDocFactory<any, any, any, any> & {
    kind: "loro.doc" | "y.doc";
};

export type InferSchemaOutput<TSchema> =
    TSchema extends StandardSchemaV1<any, infer TOutput> ? TOutput : never;

export type InferTreatyUserOutput<TUserSchema> =
    InferSchemaOutput<TUserSchema> extends infer TUser extends BaseUser ? TUser : BaseUser;

export type InferTreatyPresenceOutput<TPresenceSchema> = [TPresenceSchema] extends [undefined]
    ? Record<string, never>
    : InferSchemaOutput<TPresenceSchema> extends infer TPresence extends Record<string, any>
      ? TPresence
      : Record<string, never>;

export type InferTreatyStorageNative<TStorage> =
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> ? InferStorage<TStorage> : never;

export type InferTreatyStorageJson<TStorage> =
    TStorage extends AbstractCrdtDocFactory<any, any, any, any> ? InferJson<TStorage> : never;

export type TreatyResolverContext<
    TUser extends BaseUser,
    TPresence extends Record<string, any>,
    TJson extends Record<string, any>,
> = {
    json: DeepReadonly<TJson>;
    presence: DeepReadonly<TPresence>;
    user: TUser;
};

export type TreatyResolverDoc<
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
> = {
    get(): TNative;
    toJson(): TJson;
};

export type PresenceResolverContext<
    TUser extends BaseUser,
    TPresence extends Record<string, any>,
    TJson extends Record<string, any> = {},
> = TreatyResolverContext<TUser, TPresence, TJson>;

export type StorageResolverContext<
    TUser extends BaseUser,
    TJson extends Record<string, any>,
    TNative extends Record<string, any>,
    TPresence extends Record<string, any> = {},
> = TreatyResolverContext<TUser, TPresence, TJson> & {
    storage: TNative;
};

export type JsonSchemaProducer = {
    input: (options?: { target?: string }) => unknown;
    output?: (options?: { target?: string }) => unknown;
};

export type TreatyStorageResolveOptions = {
    transact?: boolean;
};

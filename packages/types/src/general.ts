export type Constructable = { new (...args: any[]): any };

export type HasRequiredProperty<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T] extends never
    ? false
    : true;

export type Maybe<T> = T | Nil;
export type MaybePromise<T> = Promise<T> | T;
export type MaybeReadonlyArray<T> = T[] | readonly T[];
export type Nil = null | undefined;

type OptionalPropertyNames<T> = {
    [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

export type SpreadProperties<L, R, K extends keyof L & keyof R> = {
    [P in K]: L[P] | Exclude<R[P], undefined>;
};

export type Id<T> = T extends Nil
    ? T
    : T extends infer U
      ? U extends Constructable
          ? U
          : { [K in keyof U]: U[K] }
      : never;

export type Primitive = string | number | boolean | null | undefined;

type SpreadTwo<L, R> = Id<
    Pick<L, Exclude<keyof L, keyof R>> &
        Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
        Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
        SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

export type Spread<A extends readonly [...any]> = A extends [infer L, ...infer R]
    ? SpreadTwo<L, Spread<R>>
    : unknown;

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
          ? ReadonlyArray<DeepPartial<U>>
          : DeepPartial<T[P]>;
};

export type DeepWriteable<T> = {
    -readonly [P in keyof T]: DeepWriteable<T[P]>;
};

export type UndefinedProps<T extends Record<string, any>, K extends keyof T = keyof T> = Id<
    { [P in K]?: undefined } & { [P in Exclude<keyof T, K>]: T[P] }
>;

export type OptionalProps<T extends Record<string, any>, K extends keyof T = keyof T> = Omit<T, K> &
    Partial<Pick<T, K>>;

export type NonNilProps<T extends Record<string, any>, K extends keyof T = keyof T> = Omit<T, K> & {
    [P in K]-?: NonNullable<T[P]>;
};

export type JsonPrimitive = string | number | boolean | null;

export type Json = JsonPrimitive | Json[] | readonly Json[] | { [key: string]: Json };

export type JsonObject = Record<string, Json>;

export type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never;

export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends (
    arg: infer I,
) => void
    ? I
    : never;

// Check if all properties in T are optional
// - If T is {} (no keys), all properties are optional (none exist)
// - Use HasRequiredProperty which properly handles intersection types
// - If HasRequiredProperty<T> is false, then all properties are optional
export type AreAllOptional<T> = [T] extends [{}]
    ? keyof T extends never
        ? true // T is {} - no properties, so all are "optional" (none exist)
        : HasRequiredProperty<T> extends true
          ? false // T has at least one required property
          : true // T has no required properties, so all are optional
    : false;

export type Constructable = { new (...args: any[]): any };

export type Maybe<T> = T | null | undefined;
export type MaybePromise<T> = Promise<T> | T;
export type MaybeReadonlyArray<T> = T[] | readonly T[];

type OptionalPropertyNames<T> = {
    [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never;
}[keyof T];

export type SpreadProperties<L, R, K extends keyof L & keyof R> = {
    [P in K]: L[P] | Exclude<R[P], undefined>;
};

export type Id<T> = T extends infer U
    ? U extends Constructable
        ? U
        : { [K in keyof U]: U[K] }
    : never;

type SpreadTwo<L, R> = Id<
    Pick<L, Exclude<keyof L, keyof R>> &
        Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
        Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
        SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>;

export type Spread<A extends readonly [...any]> = A extends [
    infer L,
    ...infer R
]
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

export type OptionalProps<
    T extends Record<string, any>,
    K extends keyof T = keyof T
> = Omit<T, K> & Partial<Pick<T, K>>;

export type NonNilProps<
    T extends Record<string, any>,
    K extends keyof T = keyof T
> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };

export type JsonPrimitive = string | number | boolean | null;

export type Json =
    | JsonPrimitive
    | Json[]
    | readonly Json[]
    | { [key: string]: Json };

export type JsonObject = Record<string, Json>;

export type StringLiteral<T> = T extends string
    ? string extends T
        ? never
        : T
    : never;

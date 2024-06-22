export type JsonPrimitive = string | number | boolean | null;

export type Json = JsonPrimitive | Json[] | readonly Json[] | { [key: string]: Json };

export type JsonObject = Record<string, Json>;

export type Maybe<T> = T | null | undefined;

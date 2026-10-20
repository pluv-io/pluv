import type { IODefs } from "./IODefs";
import type { RoomEffects, Suspended } from "./types";
import { isThenable } from "./utils/isThenable";

const DEFERRED_RESULT = "$u" as const;

/** A handler promise the queue must not wait on. The session manager settles this on a later join. */
export type DeferredResult<T> = { readonly [DEFERRED_RESULT]: Promise<T> };

export const deferredResult = <T>(promise: Promise<T>): DeferredResult<T> => {
    return Object.defineProperty({} as DeferredResult<T>, DEFERRED_RESULT, { value: promise });
};

export const isDeferredResult = <T>(value: T | DeferredResult<T>): value is DeferredResult<T> => {
    if (typeof value !== "object" || value === null || !(DEFERRED_RESULT in value)) return false;

    const descriptor = Object.getOwnPropertyDescriptor(value, DEFERRED_RESULT);

    return descriptor?.enumerable === false && isThenable(descriptor.value);
};

export const deferredResultPromise = <T>(result: DeferredResult<T>): Promise<T> =>
    result[DEFERRED_RESULT];

export const isSuspended = (value: unknown): value is Suspended =>
    typeof value === "object" &&
    value !== null &&
    "suspended" in value &&
    (value as { suspended?: unknown }).suspended === true;

export const isErrorMessage = (value: unknown): value is { message: string } => {
    return (
        typeof value === "object" &&
        value !== null &&
        "message" in value &&
        typeof value.message === "string"
    );
};

export const emptyRoomEffects = <T extends IODefs = IODefs>(): RoomEffects<T> => ({
    attachments: [],
    broadcast: [],
    closes: [],
    connectionId: null,
    destroy: false,
    error: null,
    self: [],
    storageDirty: false,
});

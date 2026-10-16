import type { IODefs } from "./IODefs";
import type { RoomEffects, Suspended } from "./types";
import { isThenable } from "./utils/isThenable";

const USER_TURN = "$u" as const;

/** User work the queue must not wait on. The session manager settles this on a later join. */
export type UserTurn<T> = { readonly [USER_TURN]: Promise<T> };

export const userTurn = <T>(promise: Promise<T>): UserTurn<T> => {
    return Object.defineProperty({} as UserTurn<T>, USER_TURN, { value: promise });
};

export const isUserTurn = <T>(value: T | UserTurn<T>): value is UserTurn<T> => {
    if (typeof value !== "object" || value === null || !(USER_TURN in value)) return false;

    const descriptor = Object.getOwnPropertyDescriptor(value, USER_TURN);

    return descriptor?.enumerable === false && isThenable(descriptor.value);
};

export const userTurnPromise = <T>(turn: UserTurn<T>): Promise<T> => turn[USER_TURN];

export const isSuspended = (value: unknown): value is Suspended =>
    typeof value === "object" &&
    value !== null &&
    "suspended" in value &&
    (value as { suspended?: unknown }).suspended === true;

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

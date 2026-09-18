import type { ServerOriginEvent } from "@pluv/types";

export const GARBAGE_COLLECT_INTERVAL_MS = 60_000;
export const JS_IDENTIFIER = /^[a-z_$][a-z0-9_$]*$/i;
export const MAX_PRESENCE_SIZE_BYTES = 512;
export const MAX_STORAGE_SIZE_BYTES = 31_457_280;
export const MAX_USER_ID_LENGTH = 128;
export const MAX_USER_SIZE_BYTES = 512;
export const PING_TIMEOUT_MS = 30_000;

export const PRESENCE_FANOUT_BUDGET = 100_000;
export const DEFAULT_MAX_CONNECTIONS = 256;
export const ROOM_STATS_THROTTLE_MS = 150;
export const LIST_USERS_DEFAULT_LIMIT = 50;
export const LIST_USERS_MAX_LIMIT = 100;

export const SERVER_ORIGIN_EVENTS = [
    "$error",
    "$roomStats",
    "$syncStateReceived",
] as const satisfies readonly ServerOriginEvent[];

export const isServerOriginEvent = (type: string): type is ServerOriginEvent => {
    return (SERVER_ORIGIN_EVENTS as readonly string[]).includes(type);
};

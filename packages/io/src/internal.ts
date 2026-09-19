import { ROOM_STATS_THROTTLE_MS, SERVER_ORIGIN_EVENTS, isServerOriginEvent } from "./constants";
import { createBaseRouter } from "./createBaseRouter";
import {
    assertPresenceFanoutBudget,
    createInternalPluvRouter,
    getRoomStatsFromSessions,
    groupLiveUsers,
    listLiveUsers,
    pageLiveUsers,
    resolveListUsersLimit,
    resolveMaxConnections,
    throttle,
} from "./utils";

/**
 * Maintainer / test-only surface. Not part of the public API — shape and
 * contents may change without a semver bump. Prefer public exports for apps.
 */
export const __internal = {
    assertPresenceFanoutBudget,
    createBaseRouter,
    createInternalPluvRouter,
    getRoomStatsFromSessions,
    groupLiveUsers,
    isServerOriginEvent,
    listLiveUsers,
    pageLiveUsers,
    resolveListUsersLimit,
    resolveMaxConnections,
    ROOM_STATS_THROTTLE_MS,
    SERVER_ORIGIN_EVENTS,
    throttle,
};

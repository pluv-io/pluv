import type { JsonObject } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { getLiveSessions } from "./getLiveSessions";

export type GroupedRoomUser = {
    connectionIds: string[];
    data: JsonObject;
    key: string;
    presence: JsonObject | null;
};

/**
 * Group live sockets by `user.id`. Extra tabs share one row; presence is the
 * newest `timers.presence`. `excludeSessionId` drops that person's whole row.
 */
export const groupLiveUsers = (
    sessions: readonly WebSocketSession<any>[],
    options: { excludeSessionId?: string } = {},
): GroupedRoomUser[] => {
    const live = getLiveSessions(sessions);
    const excluded = options.excludeSessionId
        ? live.find((session) => session.id === options.excludeSessionId)
        : null;
    const excludedUserId = typeof excluded?.user?.id === "string" ? excluded.user.id : null;
    const grouped = new Map<string, GroupedRoomUser>();
    const presenceTimers = new Map<string, number | null>();

    for (const session of live) {
        const userId = typeof session.user?.id === "string" ? session.user.id : null;
        if (!userId || userId === excludedUserId) continue;

        const row = grouped.get(userId);
        const presenceTimer = session.timers.presence;

        if (!row) {
            grouped.set(userId, {
                connectionIds: [session.id],
                data: session.user as JsonObject,
                key: userId,
                presence: session.presence,
            });
            presenceTimers.set(userId, presenceTimer);
            continue;
        }

        row.connectionIds.push(session.id);

        const previousTimer = presenceTimers.get(userId) ?? null;

        if (typeof presenceTimer !== "number") continue;
        if (typeof previousTimer === "number" && presenceTimer <= previousTimer) continue;

        row.presence = session.presence;
        presenceTimers.set(userId, presenceTimer);
    }

    return [...grouped.values()];
};

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
 * newest `seq.presence`. `excludeSessionId` drops that person's whole row.
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
    const presenceSeqs = new Map<string, number | null>();

    for (const session of live) {
        const userId = typeof session.user?.id === "string" ? session.user.id : null;
        if (!userId || userId === excludedUserId) continue;

        const row = grouped.get(userId);
        const presenceSeq = session.seq.presence;

        if (!row) {
            grouped.set(userId, {
                connectionIds: [session.id],
                data: session.user as JsonObject,
                key: userId,
                presence: session.presence,
            });
            presenceSeqs.set(userId, presenceSeq);
            continue;
        }

        row.connectionIds.push(session.id);

        const previousSeq = presenceSeqs.get(userId) ?? null;

        if (typeof presenceSeq !== "number") continue;
        if (typeof previousSeq === "number" && presenceSeq <= previousSeq) continue;

        row.presence = session.presence;
        presenceSeqs.set(userId, presenceSeq);
    }

    return [...grouped.values()];
};

import type { WebSocketSession } from "../types";
import { getLiveSessions } from "./getLiveSessions";

export const getRoomStatsFromSessions = (
    sessions: readonly WebSocketSession<any>[],
): { connectionCount: number; userCount: number } => {
    const live = getLiveSessions(sessions);
    const userIds = live.reduce((set, session) => {
        const userId = session.user?.id;
        return typeof userId === "string" ? set.add(userId) : set;
    }, new Set<string>());

    return {
        connectionCount: live.length,
        userCount: userIds.size,
    };
};

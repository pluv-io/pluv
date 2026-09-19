import type { WebSocketSession } from "../types";
import { getLiveSessions } from "./getLiveSessions";

export const getMyConnectionIds = (
    sessions: readonly WebSocketSession<any>[],
    requester: WebSocketSession<any> | null,
): string[] => {
    if (!requester) return [];

    const live = getLiveSessions(sessions);
    const userId = requester.user?.id;

    if (typeof userId !== "string") return [requester.id];

    return live.filter((session) => session.user?.id === userId).map((session) => session.id);
};

import type { WebSocketSession } from "../types";
import { getLiveSessions } from "./getLiveSessions";
import { getSessionKind } from "./sessionKind";

export const getMyConnectionIds = (
    sessions: readonly WebSocketSession<any>[],
    requester: WebSocketSession<any> | null,
): string[] => {
    if (!requester) return [];

    const live = getLiveSessions(sessions);
    const kind = getSessionKind(requester);
    const userId = requester.user?.id;

    if (typeof userId !== "string") return [requester.id];

    return live
        .filter((session) => getSessionKind(session) === kind && session.user?.id === userId)
        .map((session) => session.id);
};

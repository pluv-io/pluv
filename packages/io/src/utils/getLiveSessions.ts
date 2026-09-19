import type { WebSocketSession } from "../types";

export const getLiveSessions = (
    sessions: readonly WebSocketSession<any>[],
): readonly WebSocketSession<any>[] => {
    return sessions.filter((session) => !session.quit);
};

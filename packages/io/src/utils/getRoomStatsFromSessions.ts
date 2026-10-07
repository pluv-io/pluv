import type { RoomStatsByKind } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { assertExhaustive } from "./assertExhaustive";
import { getLiveSessions } from "./getLiveSessions";
import { getSessionKind } from "./sessionKind";

export const getRoomStatsFromSessions = (
    sessions: readonly WebSocketSession<any>[],
): RoomStatsByKind => {
    const live = getLiveSessions(sessions);
    const occupantIds = new Set<string>();
    const operatorIds = new Set<string>();
    let occupantConnections = 0;
    let operatorConnections = 0;

    for (const session of live) {
        const kind = getSessionKind(session);
        const userId = session.user?.id;

        switch (kind) {
            case "operator": {
                operatorConnections += 1;
                if (typeof userId === "string") operatorIds.add(userId);
                break;
            }
            case "user": {
                occupantConnections += 1;
                if (typeof userId === "string") occupantIds.add(userId);
                break;
            }
            default:
                assertExhaustive(kind);
        }
    }

    return {
        user: {
            connectionCount: occupantConnections,
            userCount: occupantIds.size,
        },
        operator: {
            connectionCount: operatorConnections,
            userCount: operatorIds.size,
        },
    };
};

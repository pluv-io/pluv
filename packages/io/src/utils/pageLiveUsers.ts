import type { ListUsersOptions, ListUsersResult } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { listLiveUsers } from "./listLiveUsers";
import { resolveListUsersLimit } from "./resolveListUsersLimit";

export const pageLiveUsers = (
    sessions: readonly WebSocketSession<any>[],
    options: ListUsersOptions = {},
): ListUsersResult<any> => {
    const resolved = resolveListUsersLimit(options.limit);

    if (!resolved.success) return resolved;

    return {
        success: true,
        ...listLiveUsers(sessions, {
            cursor: options.cursor ?? null,
            limit: resolved.limit,
        }),
    };
};

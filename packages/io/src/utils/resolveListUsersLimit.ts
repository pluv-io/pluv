import type { ListUsersError } from "@pluv/types";
import { LIST_USERS_DEFAULT_LIMIT, LIST_USERS_MAX_LIMIT } from "../constants";

export const resolveListUsersLimit = (
    limit?: number | null,
): { success: true; limit: number } | { success: false; error: ListUsersError } => {
    const resolved = limit ?? LIST_USERS_DEFAULT_LIMIT;

    if (!Number.isInteger(resolved) || resolved < 1 || resolved > LIST_USERS_MAX_LIMIT) {
        return {
            success: false,
            error: {
                code: "INVALID_LIMIT",
                message: `Invalid listUsers limit. Limit must be an integer from 1 to ${LIST_USERS_MAX_LIMIT.toLocaleString()}. Received: ${String(limit)}.`,
            },
        };
    }

    return { success: true, limit: resolved };
};

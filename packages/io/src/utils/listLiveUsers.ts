import type { JsonObject } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { groupLiveUsers } from "./groupLiveUsers";

export const listLiveUsers = (
    sessions: readonly WebSocketSession<any>[],
    options: { cursor?: string | null; limit: number },
): {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    users: { data: JsonObject }[];
} => {
    const rows = groupLiveUsers(sessions).toSorted((a, b) => {
        if (a.key < b.key) return -1;
        if (a.key > b.key) return 1;

        return 0;
    });
    const cursor = options.cursor ?? null;
    const startIndex = cursor == null ? 0 : rows.findIndex((row) => row.key > cursor);
    const from = startIndex < 0 ? rows.length : startIndex;
    const slice = rows.slice(from, from + options.limit);
    const hasNextPage = from + slice.length < rows.length;
    const endCursor = slice.at(-1)?.key ?? null;

    return {
        pageInfo: { endCursor, hasNextPage },
        users: slice.map((row) => ({ data: row.data })),
    };
};

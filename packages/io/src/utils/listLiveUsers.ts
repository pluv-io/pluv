import type { JsonObject, ListUsersCursor, OperatorUser, ParticipantKind } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { assertExhaustive } from "./assertExhaustive";
import { groupLiveUsers } from "./groupLiveUsers";

const participantOrder = (kind: ParticipantKind): number => {
    switch (kind) {
        case "user":
            return 0;
        case "operator":
            return 1;
        default:
            return assertExhaustive(kind);
    }
};

const compareToCursor = (
    row: { kind: ParticipantKind; key: string },
    cursor: ListUsersCursor,
): number => {
    const byKind = participantOrder(row.kind) - participantOrder(cursor.kind);

    if (byKind !== 0) return byKind;
    if (row.key < cursor.id) return -1;
    if (row.key > cursor.id) return 1;

    return 0;
};

export const listLiveUsers = (
    sessions: readonly WebSocketSession<any>[],
    options: { cursor?: ListUsersCursor | null; kinds?: readonly ParticipantKind[]; limit: number },
): {
    pageInfo: { endCursor: ListUsersCursor | null; hasNextPage: boolean };
    users: { data: JsonObject; kind: ParticipantKind; operator: OperatorUser | null }[];
} => {
    const rows = groupLiveUsers(sessions, {
        kinds: options.kinds ?? ["user"],
    }).toSorted((left, right) => {
        const byKind = participantOrder(left.kind) - participantOrder(right.kind);

        if (byKind !== 0) return byKind;
        if (left.key < right.key) return -1;
        if (left.key > right.key) return 1;

        return 0;
    });
    const cursor = options.cursor ?? null;
    const startIndex =
        cursor == null ? 0 : rows.findIndex((row) => compareToCursor(row, cursor) > 0);
    const from = startIndex < 0 ? rows.length : startIndex;
    const slice = rows.slice(from, from + options.limit);
    const hasNextPage = from + slice.length < rows.length;
    const last = slice.at(-1);
    const endCursor = last ? { kind: last.kind, id: last.key } : null;

    return {
        pageInfo: { endCursor, hasNextPage },
        users: slice.map((row) => ({
            data: row.data,
            kind: row.kind,
            operator: row.operator,
        })),
    };
};

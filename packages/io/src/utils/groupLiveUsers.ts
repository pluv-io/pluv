import type { JsonObject, OperatorUser, ParticipantKind } from "@pluv/types";
import type { WebSocketSession } from "../types";
import { assertExhaustive } from "./assertExhaustive";
import { getLiveSessions } from "./getLiveSessions";
import { getSessionKind, getSessionOperator } from "./sessionKind";

export type GroupedRoomUser = {
    connectionIds: string[];
    data: JsonObject;
    key: string;
    kind: ParticipantKind;
    operator: OperatorUser | null;
    presence: JsonObject | null;
};

type LiveUserKey = {
    id: string;
    kind: ParticipantKind;
};

/**
 * Group live sockets by `(kind, user id)`. Extra tabs of the same kind share
 * one row. The socket with the newest `seq.presence` supplies `presence`,
 * `data`, and `operator`. `excludeSessionId` drops that person's whole row.
 * `key` is `user.id`.
 */
export const groupLiveUsers = (
    sessions: readonly WebSocketSession<any>[],
    options: { excludeSessionId?: string; kinds?: readonly ParticipantKind[] } = {},
): GroupedRoomUser[] => {
    const live = getLiveSessions(sessions);
    const excluded = options.excludeSessionId
        ? live.find((session) => session.id === options.excludeSessionId)
        : null;
    const excludedRef = excluded ? liveUserKey(excluded) : null;
    const kinds = options.kinds ? new Set(options.kinds) : null;
    const grouped = {
        operator: new Map<string, GroupedRoomUser>(),
        user: new Map<string, GroupedRoomUser>(),
    };
    const presenceSeqs = {
        operator: new Map<string, number | null>(),
        user: new Map<string, number | null>(),
    };

    for (const session of live) {
        const ref = liveUserKey(session);
        if (!ref) continue;
        if (kinds && !kinds.has(ref.kind)) continue;
        if (sameParticipant(ref, excludedRef)) continue;

        const rows = rowsForKind(grouped, ref.kind);
        const seqs = seqsForKind(presenceSeqs, ref.kind);
        const row = rows.get(ref.id);
        const presenceSeq = session.seq.presence;
        const operator = getSessionOperator(session);

        if (!row) {
            rows.set(ref.id, {
                connectionIds: [session.id],
                data: session.user as JsonObject,
                key: ref.id,
                kind: ref.kind,
                operator,
                presence: session.presence,
            });
            seqs.set(ref.id, presenceSeq);
            continue;
        }

        row.connectionIds.push(session.id);

        const previousSeq = seqs.get(ref.id) ?? null;

        if (typeof presenceSeq !== "number") continue;
        if (typeof previousSeq === "number" && presenceSeq <= previousSeq) continue;

        row.data = session.user as JsonObject;
        row.operator = operator;
        row.presence = session.presence;
        seqs.set(ref.id, presenceSeq);
    }

    return [...grouped.user.values(), ...grouped.operator.values()];
};

const liveUserKey = (session: WebSocketSession<any>): LiveUserKey | null => {
    const kind = getSessionKind(session);
    const id = session.user?.id;

    if (typeof id !== "string") return null;

    return { kind, id };
};

const sameParticipant = (a: LiveUserKey | null, b: LiveUserKey | null): boolean => {
    return !!a && !!b && a.kind === b.kind && a.id === b.id;
};

const rowsForKind = (
    grouped: {
        operator: Map<string, GroupedRoomUser>;
        user: Map<string, GroupedRoomUser>;
    },
    kind: ParticipantKind,
): Map<string, GroupedRoomUser> => {
    switch (kind) {
        case "operator":
            return grouped.operator;
        case "user":
            return grouped.user;
        default:
            return assertExhaustive(kind);
    }
};

const seqsForKind = (
    seqs: {
        operator: Map<string, number | null>;
        user: Map<string, number | null>;
    },
    kind: ParticipantKind,
): Map<string, number | null> => {
    switch (kind) {
        case "operator":
            return seqs.operator;
        case "user":
            return seqs.user;
        default:
            return assertExhaustive(kind);
    }
};

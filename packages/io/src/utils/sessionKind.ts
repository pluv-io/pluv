import type { OperatorUser, ParticipantKind } from "@pluv/types";
import { assertExhaustive } from "./assertExhaustive";

export const getSessionKind = (session: { kind: ParticipantKind }): ParticipantKind => {
    switch (session.kind) {
        case "operator":
        case "user":
            return session.kind;
        default:
            return assertExhaustive(session.kind);
    }
};

export const getSessionOperator = (session: {
    kind: ParticipantKind;
    operator?: OperatorUser | null;
}): OperatorUser | null => {
    const kind = getSessionKind(session);

    switch (kind) {
        case "operator":
            return session.operator ?? null;
        case "user":
            return null;
        default:
            return assertExhaustive(kind);
    }
};

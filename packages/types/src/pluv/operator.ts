import type { MaybePromise } from "../general";
import type { BaseUser } from "./shared";

export type ParticipantKind = "user" | "operator";

export type OperatorUser = {
    id: string;
    name: string;
    imageUrl: string | null;
};

export type OnGetOperator<TUser extends BaseUser = BaseUser> = (params: {
    operator: OperatorUser & { email: string };
    room: string;
}) => MaybePromise<TUser | null>;

export type ParticipantKindOptions = {
    kind?: ParticipantKind;
};

export type ParticipantKindsOptions = {
    kinds?: readonly ParticipantKind[];
};

export const DEFAULT_PARTICIPANT_KIND: ParticipantKind = "user";

export const DEFAULT_PARTICIPANT_KINDS: readonly ParticipantKind[] = [DEFAULT_PARTICIPANT_KIND];

export const resolveParticipantKind = (kind?: ParticipantKind): ParticipantKind => {
    return kind ?? DEFAULT_PARTICIPANT_KIND;
};

export const resolveParticipantKinds = (
    kinds?: readonly ParticipantKind[],
): readonly ParticipantKind[] => {
    if (kinds === undefined) return DEFAULT_PARTICIPANT_KINDS;

    return [...new Set(kinds)];
};

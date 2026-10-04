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

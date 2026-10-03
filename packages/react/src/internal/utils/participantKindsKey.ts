import type { ParticipantKind, ParticipantKindsOptions } from "@pluv/types";

export const participantKindsKey = {
    toKey(kinds: readonly ParticipantKind[] | undefined): string {
        if (kinds === undefined) return "";

        return `\0${kinds.join("\0")}`;
    },
    fromKey(kindsKey: string): ParticipantKindsOptions | undefined {
        if (kindsKey === "") return undefined;

        const joined = kindsKey.slice(1);

        return { kinds: joined === "" ? [] : (joined.split("\0") as ParticipantKind[]) };
    },
};

import type { HostTreatyProcedureActor } from "../IORoom";

export const resolveHostTreatyProcedureSenderId = (
    actor: HostTreatyProcedureActor | null | undefined,
): string => {
    const senderId = actor != null && typeof actor === "object" ? actor.senderId : undefined;

    if (typeof senderId !== "string") {
        throw new Error("Host treaty invoke expected { senderId: string }");
    }

    return senderId;
};

import { DurableObjectUtils } from "@pluv-internal/cloudflare-utils";

export const getRoomId = (roomName: string, env: Env): string | null => {
    const roomId = DurableObjectUtils.isValidId(roomName)
        ? env.rooms.idFromString(roomName)
        : DurableObjectUtils.isValidName(roomName)
        ? env.rooms.idFromName(roomName)
        : null;

    return roomId?.toString() ?? null;
};

import type { RoomEffects } from "@pluv/io";
import type { PlainError } from "./types";

export const plain = {
    error: (error: unknown): PlainError => {
        if (!error) return null;

        if (error instanceof Error) return { message: error.message };

        if (typeof error === "object" && "message" in error && typeof error.message === "string") {
            return { message: error.message };
        }

        return { message: "Unexpected error" };
    },
    json: <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T,
    effects: (effects: RoomEffects): RoomEffects => {
        return plain.json({
            attachments: effects.attachments,
            broadcast: effects.broadcast,
            closes: effects.closes,
            connectionId: effects.connectionId,
            destroy: effects.destroy,
            error: plain.error(effects.error),
            self: effects.self,
            storageDirty: effects.storageDirty,
        });
    },
};

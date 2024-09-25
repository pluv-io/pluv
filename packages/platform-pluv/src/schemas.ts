import { z } from "zod";

const ZodEventInitialStorage = z.object({
    event: z.literal("initial-storage"),
    data: z.object({
        room: z.string().nullable(),
    }),
});

const ZodEventRoomDeleted = z.object({
    event: z.literal("room-deleted"),
    data: z.object({
        room: z.string(),
        storage: z.string().nullable(),
    }),
});

export const ZodEvent = z.discriminatedUnion("event", [ZodEventInitialStorage, ZodEventRoomDeleted]);

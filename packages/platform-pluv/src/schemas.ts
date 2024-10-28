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

const ZodEventUserConnected = z.object({
    event: z.literal("user-connected"),
    data: z.object({
        room: z.string(),
        storage: z.string().nullable(),
        user: z
            .object({
                id: z.string(),
            })
            .passthrough(),
    }),
});

const ZodEventUserDisconnected = z.object({
    event: z.literal("user-disconnected"),
    data: z.object({
        room: z.string(),
        storage: z.string().nullable(),
        user: z
            .object({
                id: z.string(),
            })
            .passthrough(),
    }),
});

export const ZodEvent = z.discriminatedUnion("event", [
    ZodEventInitialStorage,
    ZodEventRoomDeleted,
    ZodEventUserConnected,
    ZodEventUserDisconnected,
]);

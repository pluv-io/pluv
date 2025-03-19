import { z } from "zod";

export const ZodEventKind = z.union([
    z.literal("initial-storage"),
    z.literal("room-deleted"),
    z.literal("user-connected"),
    z.literal("user-disconnected"),
]);

export const ZodEventInitialStorage = z.object({
    event: z.literal("initial-storage"),
    data: z.object({
        room: z.string(),
    }),
});

export const ZodEventRoomDeleted = z.object({
    event: z.literal("room-deleted"),
    data: z.object({
        room: z.string(),
        storage: z.string().nullable(),
    }),
});

export const ZodEventUserConnected = z.object({
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

export const ZodEventUserDisconnected = z.object({
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

export const ZodInitialStorageResponse = z.object({
    event: z.literal("initial-storage"),
    room: z.string(),
    storage: z.string().nullable(),
});

export const ZodRoomDeletedResponse = z.object({
    event: z.literal("room-deleted"),
    room: z.string(),
});

export const ZodUserConnectedResponse = z.object({
    event: z.literal("user-connected"),
    room: z.string(),
});

export const ZodUserDisconnectedResponse = z.object({
    event: z.literal("user-disconnected"),
    room: z.string(),
});

export const ZodEventResponse = z.discriminatedUnion("event", [
    ZodInitialStorageResponse,
    ZodRoomDeletedResponse,
    ZodUserConnectedResponse,
    ZodUserDisconnectedResponse,
]);

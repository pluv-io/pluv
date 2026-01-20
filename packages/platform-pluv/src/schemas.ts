import { z } from "zod";

export const ZodEventKind = z.union([
    z.literal("initial-storage"),
    z.literal("room-destroyed"),
    z.literal("storage-destroyed"),
    z.literal("user-connected"),
    z.literal("user-disconnected"),
]);

export const ZodEventInitialStorage = z.object({
    event: z.literal("initial-storage"),
    data: z.object({
        room: z.string(),
    }),
});

export const ZodEventRoomDestroyed = z.object({
    event: z.literal("room-destroyed"),
    data: z.object({
        room: z.string(),
    }),
});

export const ZodEventStorageDestroyed = z.object({
    event: z.literal("storage-destroyed"),
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
    ZodEventRoomDestroyed,
    ZodEventStorageDestroyed,
    ZodEventUserConnected,
    ZodEventUserDisconnected,
]);

export const ZodInitialStorageResponse = z.object({
    event: z.literal("initial-storage"),
    room: z.string(),
    storage: z.string().nullable(),
});

export const ZodRoomDestroyedResponse = z.object({
    event: z.literal("room-destroyed"),
    room: z.string(),
});

export const ZodStorageDestroyedResponse = z.object({
    event: z.literal("storage-destroyed"),
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
    ZodRoomDestroyedResponse,
    ZodStorageDestroyedResponse,
    ZodUserConnectedResponse,
    ZodUserDisconnectedResponse,
]);

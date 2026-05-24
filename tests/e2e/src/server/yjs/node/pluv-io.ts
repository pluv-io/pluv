import { yjs } from "@pluv/crdt-yjs";
import { createIO, InferIORoom } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../../db";
import { rooms } from "../../../db/schema";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO(
    platformNode({
        authorize: {
            secret: PLUV_AUTH_SECRET,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        crdt: yjs,
        debug: true,
    }),
);

const router = io.router({
    sendMessage: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ receiveMessage: { message } })),
    doubleNumber: io.procedure
        .input(z.object({ value: z.number() }))
        .self(({ value }) => ({ doubledNumber: { value: value * 2 } })),
});

export const ioRooms = new Map<string, InferIORoom<typeof ioServer>>();
export const ioServer = io.server({
    router,
    getInitialStorage: async ({ room: name }) => {
        if (name !== "e2e-node-storage-saved") return null;

        const room = await db
            .select()
            .from(rooms)
            .where(eq(rooms.name, name))
            .then((rooms) => rooms[0]);
        const storage = room?.storage ?? null;

        return storage;
    },
    onStorageDestroyed: async ({ room: name, encodedState: storage }) => {
        if (name !== "e2e-node-storage-saved") return;

        db.insert(rooms)
            .values({ name, storage })
            .onConflictDoUpdate({ target: rooms.name, set: { storage } })
            .run();
    },
    onRoomDestroyed: (event) => {
        ioRooms.delete(event.room);
    },
});

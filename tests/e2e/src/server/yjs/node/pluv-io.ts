import { yjs } from "@pluv/crdt-yjs";
import { createIO, InferIORoom } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { prisma } from "../../../prisma";

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

export const rooms = new Map<string, InferIORoom<typeof ioServer>>();
export const ioServer = io.server({
    router,
    getInitialStorage: async ({ room: name }) => {
        if (name !== "e2e-node-storage-saved") return null;

        const room = await prisma.room.findUnique({ where: { name } });
        const storage = room?.storage ?? null;

        return storage;
    },
    onStorageDestroyed: async ({ room: name, encodedState: storage }) => {
        if (name !== "e2e-node-storage-saved") return;

        await prisma.room.upsert({
            where: { name },
            create: { name, storage },
            update: { storage },
        });
    },
    onRoomDestroyed: (event) => {
        rooms.delete(event.room);
    },
});

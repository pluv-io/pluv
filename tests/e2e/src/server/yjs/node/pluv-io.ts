import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { prisma } from "../../../prisma";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO({
    authorize: {
        required: true,
        secret: PLUV_AUTH_SECRET,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
    },
    crdt: yjs,
    debug: true,
    platform: platformNode(),
});

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
    DOUBLE_NUMBER: io.procedure
        .input(z.object({ value: z.number() }))
        .self(({ value }) => ({ DOUBLED_VALUE: { value: value * 2 } })),
});

export const ioServer = io.server({
    router,
    getInitialStorage: async ({ room: name }) => {
        if (name !== "e2e-node-storage-saved") return null;

        const room = await prisma.room.findUnique({ where: { name } });
        const storage = room?.storage ?? null;

        return storage;
    },
    onRoomDeleted: async ({ room: name, encodedState: storage }) => {
        if (name !== "e2e-node-storage-saved") return;

        await prisma.room.upsert({
            where: { name },
            create: { name, storage },
            update: { storage },
        });
    },
});

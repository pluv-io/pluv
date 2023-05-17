import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { prisma } from "../../prisma";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO({
    debug: true,
    authorize: {
        required: true,
        secret: PLUV_AUTH_SECRET,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
    },
    platform: platformNode(),
    onRoomDeleted: async (name, storage) => {
        console.log(name, storage);

        if (name !== "e2e-node-storage-saved") return;

        await prisma.room.upsert({
            where: { name },
            create: { name, storage },
            update: { storage },
        });
    },
    initialStorage: async (name) => {
        console.log(name);

        if (name !== "e2e-node-storage-saved") return null;

        const room = await prisma.room.findUnique({ where: { name } });
        const storage = room?.storage ?? null;

        return storage;
    },
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
});

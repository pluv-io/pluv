import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createNeonDb, isPlatformDatabaseRoom, readDatabaseUrl, rooms } from "../../../db/neon";
import { treaty } from "../../../pluv-io/yjs/platform-treaty";
import { NeonRoomPersistence } from "./neon-persistence";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO()
    .platform(platformPluv({ persistence: new NeonRoomPersistence() }))
    .config({
        secret: PLUV_AUTH_SECRET,
        treaty,
        limits: { maxConnections: 8 },
        context: ({ env }) => ({ env }),
    });

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
    SEND_SLOW_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(async ({ message }) => {
            await new Promise((resolve) => {
                setTimeout(resolve, 500);
            });

            return { RECEIVE_SLOW_MESSAGE: { message } };
        }),
});

export const ioServer = io.server({
    getInitialStorage: async ({ context, room }) => {
        if (!isPlatformDatabaseRoom(room)) return null;

        const url = readDatabaseUrl(context.env);

        if (!url) return null;

        const row = await createNeonDb(url)
            .select()
            .from(rooms)
            .where(eq(rooms.name, room))
            .then((rows) => rows[0]);

        return row?.storage ?? null;
    },
    onStorageDestroyed: async ({ context, encodedState, room }) => {
        if (!isPlatformDatabaseRoom(room)) return;

        const url = readDatabaseUrl(context.env);

        if (!url) return;

        await createNeonDb(url)
            .insert(rooms)
            .values({ name: room, storage: encodedState })
            .onConflictDoUpdate({ target: rooms.name, set: { storage: encodedState } });
    },
    router,
});

export default ioServer;

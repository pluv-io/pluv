import { yjs } from "@pluv/crdt-yjs";
import { createIO, InferIORoom } from "@pluv/io";
import { PersistenceRedis } from "@pluv/persistence-redis";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { cluster } from "./cluster";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO()
    .platform(
        platformNode({
            persistence: new PersistenceRedis({ client: cluster }),
        }),
    )
    .config({
        authorize: {
            secret: PLUV_AUTH_SECRET,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        crdt: yjs,
        debug: true,
    });

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

export const ioRooms = new Map<string, InferIORoom<typeof ioServer>>();
export const ioServer = io.server({
    getInitialStorage: () => null,
    router,
    onRoomDestroyed: (event) => {
        ioRooms.delete(event.room);
    },
});

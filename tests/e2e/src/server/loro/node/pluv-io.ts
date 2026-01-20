import { loro } from "@pluv/crdt-loro";
import { createIO, InferIORoom } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

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
        crdt: loro,
        debug: true,
    }),
);

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

export const rooms = new Map<string, InferIORoom<typeof ioServer>>();
export const ioServer = io.server({
    getInitialStorage: () => null,
    router,
    onRoomDestroyed: (event) => {
        rooms.delete(event.room);
    },
});

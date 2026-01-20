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
        debug: true,
    }),
);

export const rooms = new Map<string, InferIORoom<typeof ioServer>>();

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

export const ioServer = io.server({
    router,
    onRoomDestroyed: (event) => {
        rooms.delete(event.room);
    },
});

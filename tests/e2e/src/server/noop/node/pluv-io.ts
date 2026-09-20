import { createIO, InferIORoom } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { treaty } from "../../../pluv-io/noop/treaty";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO().platform(platformNode()).config({
    secret: PLUV_AUTH_SECRET,
    treaty,
    debug: true,
});

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

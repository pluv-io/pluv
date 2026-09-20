import { createIO, InferIORoom } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";
import { treaty } from "../../../pluv-io/loro/treaty";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO().platform(platformNode()).config({
    secret: PLUV_AUTH_SECRET,
    treaty,
    debug: true,
});

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

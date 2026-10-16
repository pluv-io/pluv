import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform";
import { z } from "zod";
import { treaty } from "../../../pluv-io/yjs/platform-treaty";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO()
    .platform(platformPluv())
    .config({
        secret: PLUV_AUTH_SECRET,
        treaty,
        limits: { maxConnections: 8 },
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
    getInitialStorage: () => null,
    router,
});

export default ioServer;

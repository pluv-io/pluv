import { loro } from "@pluv/crdt-loro";
import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

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
    crdt: loro,
    debug: true,
    platform: platformNode(),
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
});

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

export const io = createIO({
    authorize: {
        required: true,
        secret: process.env.PLUV_AUTH_SECRET!,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
    },
    platform: platformNode(),
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
});

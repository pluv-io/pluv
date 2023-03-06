import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

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
}).event("SEND_MESSAGE", {
    input: z.object({}),
    resolver: ({}) => ({}),
});

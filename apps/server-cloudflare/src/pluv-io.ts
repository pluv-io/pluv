import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
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
    platform: platformCloudflare(),
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
});

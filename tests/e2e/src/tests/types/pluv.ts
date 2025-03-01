import { platformPluv } from "@pluv/platform-pluv";
import { createIO } from "@pluv/io";
import { z } from "zod";

const io = createIO(
    platformPluv({
        authorize: {
            user: z.object({
                id: z.string(),
            }),
        },
        basePath: "/",
        publicKey: "",
        secretKey: "",
    }),
);

io.server();

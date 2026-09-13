import { platformPluv } from "@pluv/platform-pluv";
import { createIO } from "@pluv/io";
import { z } from "zod";

const io = createIO()
    .platform(
        platformPluv({
            basePath: "/",
            publicKey: "",
            secretKey: "",
        }),
    )
    .config({
        authorize: {
            user: z.object({
                id: z.string(),
            }),
        },
    });

io.server();

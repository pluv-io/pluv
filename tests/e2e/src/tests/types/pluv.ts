import { platformPluv } from "@pluv/platform-pluv";
import { createIO } from "@pluv/io";
import { createTreaty } from "@pluv/treaty";
import { z } from "zod";

const treaty = createTreaty({
    user: z.object({
        id: z.string(),
    }),
});

const io = createIO()
    .platform(
        platformPluv({
            basePath: "/",
            publicKey: "",
            secretKey: "",
        }),
    )
    .config({
        treaty,
    });

io.server();

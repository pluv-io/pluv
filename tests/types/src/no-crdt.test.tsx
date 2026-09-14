import { createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "zod";

const io = createIO()
    .platform(platformCloudflare())
    .config({
        authorize: {
            secret: "test-secret",
            user: z.object({ id: z.string() }),
        },
    });

const ioServer = io.server({
    // @ts-expect-error
    getInitialStorage: () => null,
});

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    // @ts-expect-error
    storage: yjs.storage({
        schema: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    }),
});

// @ts-expect-error authorize is required
createIO().platform(platformCloudflare()).config({});

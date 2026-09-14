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
        crdt: yjs,
    });

// @ts-expect-error
const ioServer = io.server();
// @ts-expect-error
io.server({});

io.server({
    getInitialStorage: () => null,
});

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    storage: yjs.storage({
        schema: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    }),
    initialStorage: {
        messages: [],
    },
});

// @ts-expect-error authEndpoint is required
createClient<typeof ioServer>().config({
    storage: yjs.storage({
        schema: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    }),
});

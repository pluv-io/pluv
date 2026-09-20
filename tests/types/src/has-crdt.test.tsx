import { createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createTreaty } from "@pluv/treaty";
import { z } from "zod";

const treaty = createTreaty({
    user: z.object({ id: z.string() }),
    storage: yjs.schema({
        messages: yjs.yArray(s.string()),
    }),
});

const io = createIO().platform(platformCloudflare()).config({
    secret: "test-secret",
    treaty,
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
    treaty,
    initialStorage: {
        messages: [],
    },
});

// @ts-expect-error authEndpoint is required
createClient<typeof ioServer>().config({
    treaty,
});

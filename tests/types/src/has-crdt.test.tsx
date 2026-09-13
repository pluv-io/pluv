import { infer, createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "zod";

const io = createIO(
    platformCloudflare({
        authorize: {
            secret: "test-secret",
            user: z.object({ id: z.string() }),
        },
        crdt: yjs,
    }),
);

// @ts-expect-error
const ioServer = io.server();
// @ts-expect-error
io.server({});

io.server({
    getInitialStorage: () => null,
});

const types = infer((i) => ({ io: i<typeof ioServer> }));
createClient({
    authEndpoint: () => "",
    types,
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
createClient({
    types,
    storage: yjs.storage({
        schema: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    }),
});

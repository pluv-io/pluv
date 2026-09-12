import { infer, createClient } from "@pluv/client";
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

// Should not error. getInitialStorage is required.
io.server({
    getInitialStorage: () => null,
});

const types = infer((i) => ({ io: i<typeof ioServer> }));
createClient({
    authEndpoint: () => "",
    types,
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
});

// @ts-expect-error authEndpoint is required
createClient({
    types,
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
});

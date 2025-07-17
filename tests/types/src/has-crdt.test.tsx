/* eslint-disable @typescript-eslint/ban-ts-comment */
import { infer, createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

const io = createIO(platformCloudflare({ crdt: yjs }));

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
    types,
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
});

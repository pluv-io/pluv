import { infer as clientInfer, createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

const io = createIO(platformCloudflare({}));

const ioServer = io.server({
    // @ts-expect-error
    getInitialStorage: () => null,
});

const types = clientInfer((i) => ({ io: i<typeof ioServer> }));
createClient({
    types,
    // @ts-expect-error
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
});

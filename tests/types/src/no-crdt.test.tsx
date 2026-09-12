import { infer as clientInfer, createClient } from "@pluv/client";
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
    }),
);

const ioServer = io.server({
    // @ts-expect-error
    getInitialStorage: () => null,
});

const types = clientInfer((i) => ({ io: i<typeof ioServer> }));
createClient({
    authEndpoint: () => "",
    types,
    // @ts-expect-error
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
});

// @ts-expect-error authorize is required
createIO(platformCloudflare({}));

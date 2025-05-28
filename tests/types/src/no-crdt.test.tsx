/* eslint-disable @typescript-eslint/ban-ts-comment */
import { infer as clientInfer, createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "@zod/mini";

const io = createIO(
    platformCloudflare({
        authorize: {
            secret: "",
            user: z.object({
                id: z.string(),
            }),
        },
    }),
);

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

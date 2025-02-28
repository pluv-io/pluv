import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO(
    platformCloudflare({
        context: ({ env, meta, state }) => ({ env, meta, state }),
        crdt: yjs,
    }),
);

export const ioServer = io.server();

import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({
    context: ({ env, meta, state }) => ({ env, meta, state }),
    crdt: yjs,
    platform: platformCloudflare(),
});

export const ioServer = io.server();

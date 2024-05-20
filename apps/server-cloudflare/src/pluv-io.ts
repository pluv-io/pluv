import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({
    crdt: yjs,
    platform: platformCloudflare(),
});

export const ioServer = io.server();

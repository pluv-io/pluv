import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { PersistanceRedis } from "@pluv/persistance-redis";
import { platformNode } from "@pluv/platform-node";
import { PubSubRedis } from "@pluv/pubsub-redis";
import { z } from "zod";
import { cluster } from "../cluster";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO({
    authorize: {
        required: true,
        secret: PLUV_AUTH_SECRET,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
    },
    crdt: yjs,
    debug: true,
    platform: platformNode({
        persistance: new PersistanceRedis({ client: cluster }),
        pubSub: new PubSubRedis({
            publisher: cluster,
            subscriber: cluster,
        }),
    }),
});

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

export const ioServer = io.server({ router });

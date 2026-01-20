import { yjs } from "@pluv/crdt-yjs";
import { createIO, InferIORoom } from "@pluv/io";
import { PersistenceRedis } from "@pluv/persistence-redis";
import { platformNode } from "@pluv/platform-node";
import { PubSubRedis } from "@pluv/pubsub-redis";
import { z } from "zod";
import { cluster } from "../cluster";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO(
    platformNode({
        authorize: {
            secret: PLUV_AUTH_SECRET,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        crdt: yjs,
        debug: true,
        persistence: new PersistenceRedis({ client: cluster }),
        pubSub: new PubSubRedis({
            publisher: cluster,
            subscriber: cluster,
        }),
    }),
);

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

export const rooms = new Map<string, InferIORoom<typeof ioServer>>();
export const ioServer = io.server({
    getInitialStorage: () => null,
    router,
    onRoomDestroyed: (event) => {
        rooms.delete(event.room);
    },
});

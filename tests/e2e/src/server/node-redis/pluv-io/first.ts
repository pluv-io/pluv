import { createIO } from "@pluv/io";
import { PersistanceRedis } from "@pluv/persistance-redis";
import { platformNode } from "@pluv/platform-node";
import { PubSubRedis } from "@pluv/pubsub-redis";
import { z } from "zod";
import { cluster } from "../cluster";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO({
    debug: true,
    authorize: {
        required: true,
        secret: PLUV_AUTH_SECRET,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
    },
    platform: platformNode({
        persistance: new PersistanceRedis({ client: cluster }),
        pubSub: new PubSubRedis({
            publisher: cluster,
            subscriber: cluster,
        }),
    }),
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
});

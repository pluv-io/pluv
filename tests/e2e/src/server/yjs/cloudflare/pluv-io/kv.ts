import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "zod";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";

const PLUV_AUTH_SECRET = "secret123";

export const io = createIO(
    platformCloudflare({
        authorize: {
            secret: PLUV_AUTH_SECRET,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        crdt: yjs,
        debug: true,
        persistence: new PersistenceCloudflareTransactionalStorage({ mode: "kv" }),
    }),
);

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }, ctx) => ({ RECEIVE_MESSAGE: { message: ctx.session.user } })),
});

export const ioServer = io.server({ router });

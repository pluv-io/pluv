import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { PersistenceCloudflareTransactionalStorage } from "@pluv/persistence-cloudflare-transactional-storage";
import { infer, platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "zod";

const PLUV_AUTH_SECRET = "secret123";
const PLUV_KV_KEY = "TEST_DATA";
const SAVED_ROOM_NAME = "47d823c8aa9956f9625dbbd4f258eaef6a773a7ef8c2f0a9d72061dcd849125b";

const types = infer((i) => ({ env: i<CloudflareEnv> }));
export const io = createIO(
    platformCloudflare({
        types,
        authorize: ({ env }) => ({
            secret: PLUV_AUTH_SECRET,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        }),
        context: ({ env }) => ({ env }),
        crdt: yjs,
        debug: true,
        persistence: new PersistenceCloudflareTransactionalStorage({ mode: "sqlite" }),
    }),
);

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }, ctx) => ({ RECEIVE_MESSAGE: { message } })),
});

export const ioServer = io.server({
    getInitialStorage: async ({ context, room: name }) => {
        if (name !== SAVED_ROOM_NAME) return null;

        const { env } = context;
        const storage = await env.pluv_kv.get(`${PLUV_KV_KEY}::name`);

        return storage ?? null;
    },
    onRoomDeleted: async ({ context, room: name, encodedState: storage }) => {
        if (name !== SAVED_ROOM_NAME) return null;

        const { env } = context;
        if (!!storage) {
            await env.pluv_kv.put(`${PLUV_KV_KEY}::name`, storage);
        } else {
            await env.pluv_kv.delete(`${PLUV_KV_KEY}::name`);
        }
    },
    router,
});

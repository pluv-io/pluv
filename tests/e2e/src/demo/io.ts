import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";
import { z } from "zod";

export const io = createIO(
    platformNode({
        authorize: {
            secret: process.env.PLUV_AUTH_SECRET!,
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        crdt: yjs,
    }),
);

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
    DOUBLE_NUMBER: io.procedure
        .input(z.object({ value: z.number() }))
        .self(({ value }) => ({ DOUBLED_VALUE: { value: value * 2 } })),
});

export const ioServer = io.server({ router });

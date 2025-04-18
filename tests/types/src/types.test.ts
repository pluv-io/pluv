/* eslint-disable @typescript-eslint/ban-ts-comment */
import { infer as clientInfer, createClient } from "@pluv/client";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "@zod/mini";
import { expectTypeOf } from "expect-type";

const io = createIO(
    platformCloudflare({
        authorize: {
            secret: "",
            user: z.object({
                id: z.string(),
            }),
        },
        context: ({ env, meta, state }) => ({ env, meta, state }),
    }),
);

const router = io.router({
    sendMessage: io.procedure
        .input(
            z.object({
                message: z.string(),
            }),
        )
        .broadcast(({ message }) => ({
            receiveMessage: { message },
        })),
});

const ioServer = io.server({
    router,
    onRoomDeleted: async ({ context }) => {
        expectTypeOf<typeof context>().toEqualTypeOf<{
            env: {};
            meta: undefined;
            state: DurableObjectState;
        }>();
    },
});

const types = clientInfer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    authEndpoint: () => "",
    types,
});

const room = client.createRoom("test-room");

room.event.receiveMessage((params) => {
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{ message: string }>();
    expectTypeOf<(typeof params)["data"]>().toBeObject();
    // @ts-expect-error
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{}>();
});

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { infer as clientInfer, createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createBundle } from "@pluv/react";
import { z } from "@zod/mini";
import { expectTypeOf } from "expect-type";
import type { Array as YArray } from "yjs";

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
    initialStorage: yjs.doc((t) => ({
        messages: t.array<string>("messages"),
    })),
    types,
});

const room = client.createRoom("test-room", {
    initialStorage: yjs.doc((t) => ({
        messages: t.array("messages"),
    })),
});

room.event.receiveMessage((params) => {
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{ message: string }>();
    expectTypeOf<(typeof params)["data"]>().toBeObject();
    // @ts-expect-error
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{}>();
});

room.storage("messages", (messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});

const { PluvRoomProvider, useStorage } = createBundle(client);

<PluvRoomProvider
    initialStorage={(t) => ({
        messages: t.array("messages"),
    })}
    room="test-room"
>
    <div />
</PluvRoomProvider>;

<PluvRoomProvider
    // @ts-expect-error
    initialStorage={(t) => ({
        invalidKey: t.array("invalidKey"),
    })}
    room="test-room"
>
    <div />
</PluvRoomProvider>;

const storageMessages = useStorage("messages");

expectTypeOf(storageMessages[0]).toEqualTypeOf<string[] | null>();
expectTypeOf(storageMessages[1]).toEqualTypeOf<yjs.YjsType<YArray<string>, string[]> | null>();

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { infer as clientInfer, createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createBundle } from "@pluv/react";
import type { CrdtDocLike } from "@pluv/types";
import { z } from "@zod/mini";
import { expectTypeOf } from "expect-type";
import type { Array as YArray, Doc as YDoc } from "yjs";

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
    presence: z.object({
        cursor: z.nullable(z.object({ x: z.number(), y: z.number() })),
    }),
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

room.storage.messages((messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});

room.storage((storage) => {
    expectTypeOf<typeof storage>().toEqualTypeOf<{ messages: string[] }>();
});

room.subscribe.connection((event) => {
    expectTypeOf<typeof event.authorization.user>().toExtend<{ id: string } | null>();
});
room.subscribe.other("example-connection-id", (value) => {
    const user = value?.user ?? null;

    expectTypeOf<typeof user>().toExtend<{ id: string } | null>();
});
room.subscribe.others((others, event) => {
    expectTypeOf<(typeof others)[number]["user"]>().toExtend<{ id: string }>();
    expectTypeOf<(typeof event)["kind"]>().toExtend<
        "sync" | "clear" | "enter" | "leave" | "update"
    >();
});
room.subscribe.event("receiveMessage", (event) => {
    expectTypeOf<(typeof event)["data"]>().toEqualTypeOf<{ message: string }>();
    expectTypeOf<(typeof event)["data"]>().toBeObject();
    // @ts-expect-error
    expectTypeOf<(typeof event)["data"]>().toEqualTypeOf<{}>();
});
room.subscribe.event.receiveMessage((event) => {
    expectTypeOf<(typeof event)["data"]>().toEqualTypeOf<{ message: string }>();
    expectTypeOf<(typeof event)["data"]>().toBeObject();
    // @ts-expect-error
    expectTypeOf<(typeof event)["data"]>().toEqualTypeOf<{}>();
});
room.subscribe.storage("messages", (messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});
room.subscribe.storage.messages((messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});
room.subscribe.myPresence((myPresence) => {
    expectTypeOf<typeof myPresence>().toEqualTypeOf<{
        cursor: { x: number; y: number } | null;
    } | null>();

    // @ts-expect-error
    expectTypeOf<typeof myPresence>().toEqualTypeOf<{
        invalidKey: { x: number; y: number } | null;
    } | null>();

    // @ts-expect-error
    expectTypeOf<typeof myPresence>().toEqualTypeOf<{ cursor: number }>();
});

expectTypeOf(room.getDoc()).toEqualTypeOf<CrdtDocLike<
    YDoc,
    { messages: yjs.YjsType<YArray<string>, string[]> }
> | null>();

const { PluvRoomProvider, useDoc, useStorage } = createBundle(client);

<PluvRoomProvider
    initialPresence={{
        cursor: null,
    }}
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

expectTypeOf(useDoc()).toEqualTypeOf<CrdtDocLike<
    YDoc,
    { messages: yjs.YjsType<YArray<string>, string[]> }
> | null>();

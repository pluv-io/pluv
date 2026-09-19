import { createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createBundle } from "@pluv/react";
import type { CrdtDocLike } from "@pluv/types";
import { expectTypeOf } from "expect-type";
import type { Array as YArray, Doc as YDoc } from "yjs";
import { z } from "zod";

const io = createIO()
    .platform(platformCloudflare())
    .config({
        authorize: {
            secret: "",
            user: z.object({
                id: z.string(),
            }),
        },
        context: ({ env, meta, state }) => ({ env, meta, state }),
        crdt: yjs,
    });

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
    getInitialStorage: () => null,
    router,
    onRoomDestroyed: async ({ context }) => {
        expectTypeOf<typeof context>().toEqualTypeOf<{
            env: {};
            meta: undefined;
            state: DurableObjectState;
        }>();
    },
});

const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    storage: yjs.storage({
        schema: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    }),
    initialStorage: {
        messages: [],
    },
    presence: z.object({
        cursor: z.nullable(z.object({ x: z.number(), y: z.number() })),
    }),
});

const room = client.createRoom("test-room", {
    initialStorage: {
        messages: ["hello"],
    },
});

room.subscribe.event.receiveMessage((params) => {
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{ message: string }>();
    expectTypeOf<(typeof params)["data"]>().toBeObject();
    // @ts-expect-error
    expectTypeOf<(typeof params)["data"]>().toEqualTypeOf<{}>();
});
// @ts-expect-error protocol events are not public
room.subscribe.event("$exit", () => {});
room.subscribe.error((error) => {
    expectTypeOf(error.message).toEqualTypeOf<string>();
});

room.subscribe.storage("messages", (messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});

room.subscribe.storage.messages((messages) => {
    expectTypeOf<typeof messages>().toEqualTypeOf<string[]>();
});

room.subscribe.storage((storage) => {
    expectTypeOf<typeof storage>().toEqualTypeOf<{ messages: string[] }>();
});

room.subscribe.connection((event) => {
    expectTypeOf<typeof event.authorization.user>().toEqualTypeOf<{ id: string } | null>();
});
room.subscribe.myself((myself) => {
    expectTypeOf<typeof myself>().toExtend<{
        data: { id: string };
    } | null>();
    if (myself) {
        expectTypeOf(myself.data).toEqualTypeOf<{ id: string }>();
        // @ts-expect-error connectionId is not a person field
        expectTypeOf(myself.connectionId).toEqualTypeOf<string>();
    }
});
room.subscribe.other("example-user-id", (value) => {
    const user = value?.data ?? null;

    expectTypeOf<typeof user>().toEqualTypeOf<{ id: string } | null>();
});
room.subscribe.others((others, event) => {
    expectTypeOf<(typeof others)[number]["data"]>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<(typeof event)["kind"]>().toExtend<
        "sync" | "clear" | "enter" | "leave" | "update"
    >();
});
room.subscribe.roomStats((stats) => {
    expectTypeOf(stats).toEqualTypeOf<{ connectionCount: number; userCount: number }>();
});
expectTypeOf(room.getOther("example-user-id")?.data).toEqualTypeOf<{ id: string } | undefined>();
expectTypeOf(room.getOtherByConnectionId("example-connection-id")?.presence).toEqualTypeOf<
    { cursor: { x: number; y: number } | null } | undefined
>();
expectTypeOf(room.getRoomStats()).toEqualTypeOf<{ connectionCount: number; userCount: number }>();
expectTypeOf(room.listUsers).toBeCallableWith();
declare const listUsersResult: Awaited<ReturnType<typeof room.listUsers>>;
if (listUsersResult.success) {
    expectTypeOf<(typeof listUsersResult.users)[number]["data"]>().toEqualTypeOf<{
        id: string;
    }>();
    expectTypeOf(listUsersResult.pageInfo.hasNextPage).toEqualTypeOf<boolean>();
} else {
    expectTypeOf(listUsersResult.error.code).toEqualTypeOf<
        "FAILED" | "INVALID_LIMIT" | "NOT_CONNECTED"
    >();
    expectTypeOf(listUsersResult).not.toHaveProperty("users");
}
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

expectTypeOf(room.getDoc()).toEqualTypeOf<
    CrdtDocLike<
        YDoc,
        {
            messages: YArray<string>;
        },
        {
            messages: string[];
        }
    >
>();

const { PluvRoomProvider, useDoc, useOther, useRoomError, useRoomStats, useStorage } =
    createBundle(client);

useRoomError((error) => {
    expectTypeOf(error.message).toEqualTypeOf<string>();
});

<PluvRoomProvider
    initialPresence={{
        cursor: null,
    }}
    initialStorage={{
        messages: [],
    }}
    room="test-room"
>
    <div />
</PluvRoomProvider>;

<PluvRoomProvider
    initialStorage={{
        // @ts-expect-error extra seed keys are not allowed
        invalidKey: [],
    }}
    room="test-room"
>
    <div />
</PluvRoomProvider>;

const storageMessages = useStorage("messages");

expectTypeOf(useRoomStats()).toEqualTypeOf<{ connectionCount: number; userCount: number }>();
expectTypeOf(useRoomStats((stats) => stats.userCount)).toEqualTypeOf<number>();
expectTypeOf(useOther("example-user-id")?.data).toEqualTypeOf<{ id: string } | undefined>();

expectTypeOf(storageMessages[0]).toEqualTypeOf<string[] | null>();
expectTypeOf(storageMessages[1]).toEqualTypeOf<YArray<string> | null>();

expectTypeOf(storageMessages).toEqualTypeOf<
    [data: null, sharedType: null] | [data: string[], sharedType: YArray<string>]
>();

const [storageMessagesData, storageMessagesSharedType] = storageMessages;

if (!!storageMessagesSharedType) {
    expectTypeOf(storageMessagesData).toEqualTypeOf<string[]>();
} else {
    expectTypeOf(storageMessagesData).toEqualTypeOf<null>();
}

expectTypeOf(useDoc()).toEqualTypeOf<
    CrdtDocLike<
        YDoc,
        {
            messages: YArray<string>;
        },
        {
            messages: string[];
        }
    >
>();

const defaultedClient = createClient<typeof ioServer>().config({
    authEndpoint: ({ metadata }) => metadata.authEndpoint,
    metadata: z.object({
        authEndpoint: z.string().default("/api/pluv/authorize"),
    }),
    presence: z.object({
        blocknote: z.any().default({}),
        count: z.number(),
    }),
});

const { PluvRoomProvider: DefaultedRoomProvider } = createBundle(defaultedClient);

<DefaultedRoomProvider initialPresence={{ count: 0 }} metadata={{}} room="test-room">
    <div />
</DefaultedRoomProvider>;

defaultedClient.createRoom("test-room", {
    initialPresence: { count: 0 },
});

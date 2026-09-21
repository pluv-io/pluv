import { createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO, type InferIORoom } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createBundle } from "@pluv/react";
import { createTreaty } from "@pluv/treaty";
import type { CrdtDocLike } from "@pluv/types";
import { expectTypeOf } from "expect-type";
import type { Array as YArray, Doc as YDoc } from "yjs";
import { z } from "zod";

const user = z.object({
    id: z.string(),
});

const storage = yjs.schema({
    messages: yjs.yArray(s.string()),
});

const treaty = createTreaty({
    user,
    presence: z.object({
        cursor: z.nullable(z.object({ x: z.number(), y: z.number() })),
    }),
    storage,
});

const select = treaty.procedure.presence
    .input(z.object({ id: z.string().nullable() }))
    .resolve(({ id }, context) => {
        const { user: sessionUser, presence, json } = context;

        expectTypeOf(sessionUser).toEqualTypeOf<{ id: string }>();
        expectTypeOf(presence).toEqualTypeOf<{
            readonly cursor: { readonly x: number; readonly y: number } | null;
        }>();
        expectTypeOf(json.messages).toEqualTypeOf<readonly string[]>();
        // @ts-expect-error presence resolvers do not receive storage natives
        void context.storage;

        return { cursor: id ? { x: 0, y: 0 } : null };
    });

const addMessage = treaty.procedure.storage
    .input(z.object({ text: z.string() }))
    .resolve(({ text }, { user: sessionUser, json, presence, storage: docStorage }) => {
        expectTypeOf(sessionUser).toEqualTypeOf<{ id: string }>();
        expectTypeOf(presence).toEqualTypeOf<{
            readonly cursor: { readonly x: number; readonly y: number } | null;
        }>();
        expectTypeOf(json.messages).toEqualTypeOf<readonly string[]>();
        expectTypeOf(docStorage.messages).toEqualTypeOf<YArray<string>>();
        docStorage.messages.push([text]);
    });

const routedTreaty = treaty.router({
    select,
    addMessage,
});

expectTypeOf(routedTreaty._defs.procedures.presence).toHaveProperty("select");
expectTypeOf(routedTreaty._defs.procedures.storage).toHaveProperty("addMessage");
expectTypeOf(routedTreaty._defs.procedures.presence.select.kind).toEqualTypeOf<"presence">();
expectTypeOf(routedTreaty._defs.procedures.storage.addMessage.kind).toEqualTypeOf<"storage">();

const presenceOnlyTreaty = treaty.router({ select });
const storageOnlyTreaty = treaty.router({ addMessage });
const mergedTreaty = presenceOnlyTreaty.mergeRouters(storageOnlyTreaty);

expectTypeOf(mergedTreaty._defs.procedures.presence).toHaveProperty("select");
expectTypeOf(mergedTreaty._defs.procedures.storage).toHaveProperty("addMessage");

const io = createIO()
    .platform(platformCloudflare())
    .config({
        secret: "",
        treaty: routedTreaty,
        context: ({ env, meta, state }) => ({ env, meta, state }),
    });

const router = io.router({
    sendMessage: io.procedure
        .input(
            z.object({
                message: z.string(),
            }),
        )
        .broadcast(({ message }, { session, presence, doc }) => {
            expectTypeOf(session.user).toEqualTypeOf<{ id: string }>();
            expectTypeOf(presence).toEqualTypeOf<{
                cursor: { x: number; y: number } | null;
            } | null>();
            expectTypeOf(doc.value).toEqualTypeOf<YDoc>();

            return {
                receiveMessage: { message },
            };
        }),
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
    treaty: routedTreaty,
    initialStorage: {
        messages: [],
    },
});

expectTypeOf(ioServer._defs.treaty._defs.procedures.presence).toHaveProperty("select");
expectTypeOf(ioServer._defs.treaty._defs.procedures.storage).toHaveProperty("addMessage");
expectTypeOf(client._defs.treaty._defs.procedures.presence).toHaveProperty("select");
expectTypeOf(client._defs.treaty._defs.procedures.storage).toHaveProperty("addMessage");

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

room.subscribe.storage((exampleStorage) => {
    expectTypeOf<typeof exampleStorage>().toEqualTypeOf<{ messages: string[] }>();
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
    const exampleUser = value?.data ?? null;

    expectTypeOf<typeof exampleUser>().toEqualTypeOf<{ id: string } | null>();
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

expectTypeOf(room.presence).toHaveProperty("select");
expectTypeOf(room.presence).not.toHaveProperty("addMessage");
expectTypeOf(room.storage).toHaveProperty("addMessage");
expectTypeOf(room.storage).not.toHaveProperty("select");

expectTypeOf(room.presence.select).toBeCallableWith({ id: "item" });
expectTypeOf(room.presence.select).toBeCallableWith({ id: null });
expectTypeOf(room.presence.select).parameters.toEqualTypeOf<[{ id: string | null }]>();
expectTypeOf(room.presence.select).returns.toEqualTypeOf<Promise<void>>();
expectTypeOf(room.presence).toBeCallableWith("select", { id: "item" });
expectTypeOf(room.presence).toBeCallableWith("select", { id: null });

expectTypeOf(room.storage.addMessage).toBeCallableWith({ text: "hello" });
expectTypeOf(room.storage.addMessage).parameters.toEqualTypeOf<[{ text: string }]>();
expectTypeOf(room.storage.addMessage).returns.toBeVoid();
expectTypeOf(room.storage).toBeCallableWith("addMessage", { text: "world" });

void room.presence.select({ id: "item" });
void room.presence("select", { id: null });
room.storage.addMessage({ text: "hello" });
room.storage("addMessage", { text: "world" });

// @ts-expect-error presence input must match the procedure schema
void room.presence.select({ id: 1 });
// @ts-expect-error presence input does not accept storage fields
void room.presence.select({ text: "hello" });
// @ts-expect-error presence procedures do not take a senderId on the client
void room.presence.select({ id: "item" }, "sender-id");
// @ts-expect-error unknown presence procedure
void room.presence.missing({ id: null });
// @ts-expect-error storage procedure name is not a presence procedure
void room.presence("addMessage", { text: "hello" });
// @ts-expect-error presence procedure name is not a storage procedure
room.storage("select", { id: null });
// @ts-expect-error storage input must match the procedure schema
room.storage.addMessage({ text: 1 });
// @ts-expect-error storage input does not accept presence fields
room.storage.addMessage({ id: "item" });
// @ts-expect-error unknown storage procedure
room.storage.missing({ text: "hello" });

declare const ioRoom: InferIORoom<typeof ioServer>;

expectTypeOf(ioRoom.__experimental_presence.select).toBeCallableWith({ id: "item" }, "sender-id");
expectTypeOf(ioRoom.__experimental_presence.select).parameters.toEqualTypeOf<
    [{ id: string | null }, string]
>();
expectTypeOf(ioRoom.__experimental_presence.select).returns.toEqualTypeOf<Promise<void>>();
expectTypeOf(ioRoom.__experimental_presence).toBeCallableWith("select", { id: null }, "sender-id");
expectTypeOf(ioRoom.__experimental_storage.addMessage).toBeCallableWith(
    { text: "hello" },
    "sender-id",
);
expectTypeOf(ioRoom.__experimental_storage.addMessage).parameters.toEqualTypeOf<
    [{ text: string }, string]
>();
expectTypeOf(ioRoom.__experimental_storage).toBeCallableWith(
    "addMessage",
    { text: "world" },
    "sender-id",
);

void ioRoom.__experimental_presence.select({ id: "item" }, "sender-id");
void ioRoom.__experimental_storage.addMessage({ text: "hello" }, "sender-id");

// @ts-expect-error IORoom presence invoke requires senderId
void ioRoom.__experimental_presence.select({ id: "item" });
// @ts-expect-error IORoom storage invoke requires senderId
void ioRoom.__experimental_storage.addMessage({ text: "hello" });
// @ts-expect-error IORoom presence input must match the procedure schema
void ioRoom.__experimental_presence.select({ id: 1 }, "sender-id");
// @ts-expect-error unknown IORoom presence procedure
void ioRoom.__experimental_presence.missing({ id: null }, "sender-id");

const {
    PluvRoomProvider,
    useDoc,
    useOther,
    usePresence,
    useRoomError,
    useRoomStats,
    useStorage,
    useStorageField,
} = createBundle(client);

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

const storageMessages = useStorageField("messages");
const presence = usePresence();
const storageCommands = useStorage();

expectTypeOf(presence.select).toBeCallableWith({ id: "item" });
expectTypeOf(presence.select).parameters.toEqualTypeOf<[{ id: string | null }]>();
expectTypeOf(presence).toBeCallableWith("select", { id: null });
expectTypeOf(storageCommands.addMessage).toBeCallableWith({ text: "hello" });
expectTypeOf(storageCommands.addMessage).parameters.toEqualTypeOf<[{ text: string }]>();
expectTypeOf(storageCommands).toBeCallableWith("addMessage", { text: "world" });

void presence.select({ id: "item" });
storageCommands.addMessage({ text: "hello" });

// @ts-expect-error presence input must match the procedure schema
void presence.select({ id: 1 });
// @ts-expect-error storage input must match the procedure schema
storageCommands.addMessage({ text: 1 });
// @ts-expect-error unknown presence procedure
presence.missing({ id: null });
// @ts-expect-error unknown storage procedure
storageCommands.missing({ text: "hello" });
// @ts-expect-error useStorageField keys must be storage fields
useStorageField("missing");

expectTypeOf(useRoomStats()).toEqualTypeOf<{ connectionCount: number; userCount: number }>();
expectTypeOf(useRoomStats((stats) => stats.userCount)).toEqualTypeOf<number>();
expectTypeOf(useOther("example-user-id")?.data).toEqualTypeOf<{ id: string } | undefined>();

expectTypeOf(storageMessages[0]).toEqualTypeOf<string[] | null>();
expectTypeOf(storageMessages[1]).toEqualTypeOf<YArray<string> | null>();

expectTypeOf(storageMessages).toEqualTypeOf<
    [data: null, sharedType: null] | [data: string[], sharedType: YArray<string>]
>();

const [storageMessagesData, storageMessagesSharedType] = storageMessages;

if (storageMessagesSharedType) {
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

const defaultedTreaty = createTreaty({
    user,
    presence: z.object({
        blocknote: z.any().default({}),
        count: z.number(),
    }),
    storage,
});

const defaultedIO = createIO().platform(platformCloudflare()).config({
    secret: "",
    treaty: defaultedTreaty,
});

const defaultedIOServer = defaultedIO.server({
    getInitialStorage: () => null,
});

const defaultedClient = createClient<typeof defaultedIOServer>().config({
    authEndpoint: ({ metadata }) => metadata.authEndpoint,
    metadata: z.object({
        authEndpoint: z.string().default("/api/pluv/authorize"),
    }),
    treaty: defaultedTreaty,
});

const { PluvRoomProvider: DefaultedRoomProvider } = createBundle(defaultedClient);

<DefaultedRoomProvider initialPresence={{ count: 0 }} metadata={{}} room="test-room">
    <div />
</DefaultedRoomProvider>;

defaultedClient.createRoom("test-room", {
    initialPresence: { count: 0 },
});

import { addonIndexedDB } from "@pluv/addon-indexeddb";
import {
    createClient,
    PluvRouter,
    type PluvClient,
    type PluvRoom,
    type PluvRoomAddon,
} from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createBundle } from "@pluv/react";
import { createTreaty } from "@pluv/treaty";
import type { BaseUser } from "@pluv/types";
import { expectTypeOf } from "expect-type";
import { z } from "zod";

const treaty = createTreaty({
    user: z.object({
        id: z.string(),
        name: z.string(),
    }),
    presence: z.object({
        cursor: z.object({ x: z.number(), y: z.number() }),
    }),
    storage: yjs.schema({
        messages: yjs.yArray(s.string()),
    }),
});

const io = createIO().platform(platformCloudflare()).config({
    secret: "test-secret",
    treaty,
});

const serverRouter = io.router({
    sendMessage: io.procedure.input(z.object({ message: z.string() })).broadcast(({ message }) => ({
        receiveMessage: { message },
    })),
});

const ioServer = io.server({
    getInitialStorage: () => null,
    router: serverRouter,
});

const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    treaty,
    initialStorage: {
        messages: [],
    },
    metadata: z.object({
        token: z.string(),
    }),
});

type ClientBag = typeof client extends PluvClient<infer TDefs> ? TDefs : never;
type ClientIO = ClientBag["io"];
type ClientIODefs = ClientIO["_defs"];

expectTypeOf<ClientIODefs>().toHaveProperty("treaty");
expectTypeOf<ClientIODefs>().toHaveProperty("events");
expectTypeOf<"platform" extends keyof ClientIODefs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<"context" extends keyof ClientIODefs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<"authorize" extends keyof ClientIODefs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<"crdt" extends keyof ClientIODefs ? true : false>().toEqualTypeOf<false>();

const room = client.createRoom("test-room");

expectTypeOf(room.getMyPresence()).toEqualTypeOf<{ cursor: { x: number; y: number } }>();
room.subscribe.myPresence((presence) => {
    expectTypeOf(presence).toEqualTypeOf<{ cursor: { x: number; y: number } } | null>();
});

room.subscribe.connection((event) => {
    expectTypeOf(event.authorization.user).toEqualTypeOf<{ id: string; name: string } | null>();
});
room.subscribe.myself((myself) => {
    if (myself) {
        expectTypeOf(myself.data).toEqualTypeOf<{ id: string; name: string }>();
        expectTypeOf(myself.data).not.toEqualTypeOf<BaseUser>();
    }
});

room.subscribe.event.receiveMessage((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{ message: string }>();
});

const clientEventRoom = client.createRoom("client-events", {
    router: client.router({
        shout: client.procedure
            .input(z.object({ text: z.string() }))
            .broadcast(({ text }, { user, doc }) => {
                expectTypeOf(user.data).toEqualTypeOf<{ id: string; name: string }>();
                expectTypeOf(user.presence).toEqualTypeOf<{
                    cursor: { x: number; y: number };
                }>();
                expectTypeOf(doc.value).not.toBeNever();

                return { shouted: { text } };
            }),
    }),
});

clientEventRoom.subscribe.event.shouted((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{ text: string }>();
});
clientEventRoom.subscribe.event.receiveMessage((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{ message: string }>();
});

expectTypeOf(clientEventRoom.getMyPresence()).toEqualTypeOf<{
    cursor: { x: number; y: number };
}>();

type ClientBagAfterRoom = typeof client extends PluvClient<infer TDefs> ? TDefs : never;
type RoomBag = typeof clientEventRoom extends PluvRoom<infer TDefs> ? TDefs : never;
expectTypeOf<RoomBag["presence"]>().toEqualTypeOf<ClientBagAfterRoom["presence"]>();
expectTypeOf<RoomBag["storage"]>().toEqualTypeOf<ClientBagAfterRoom["storage"]>();
expectTypeOf<RoomBag["io"]>().toEqualTypeOf<ClientBagAfterRoom["io"]>();
expectTypeOf<RoomBag["events"]>().toHaveProperty("shout");

const noRouterRoom = client.createRoom("no-router");
noRouterRoom.subscribe.event.receiveMessage((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{ message: string }>();
});

const shouts = client.router({
    shout: client.procedure
        .input(z.object({ text: z.string() }))
        .broadcast(({ text }) => ({ shouted: { text } })),
});
const waves = client.router({
    wave: client.procedure.broadcast(() => ({ waved: {} })),
});
const merged = PluvRouter.merge(shouts, waves);
expectTypeOf(merged._defs.events).toHaveProperty("shout");
expectTypeOf(merged._defs.events).toHaveProperty("wave");

client.createRoom("with-addon", {
    addons: [addonIndexedDB()],
});

declare const looseRoom: PluvRoom;
looseRoom.subscribe.connection((event) => {
    expectTypeOf(event.authorization.user).not.toEqualTypeOf<BaseUser | null>();
});
declare const looseAddon: PluvRoomAddon;
looseAddon({ room: looseRoom });

const { event, useBroadcast } = createBundle(client, {
    router: client.router({
        ping: client.procedure.broadcast(() => ({ pong: {} })),
    }),
});

expectTypeOf(event.pong.useEvent).toBeFunction();
expectTypeOf(event.receiveMessage.useEvent).toBeFunction();
// @ts-expect-error protocol events are not public
event.$error.useEvent(() => {});
const broadcast = useBroadcast();
expectTypeOf(broadcast.ping).toBeFunction();
expectTypeOf(broadcast.sendMessage).toBeFunction();

const untypedClient = createClient().config({
    authEndpoint: () => "",
    treaty,
    initialStorage: {
        messages: [],
    },
});

expectTypeOf(untypedClient.createRoom("untyped").getMyPresence()).toEqualTypeOf<{
    cursor: { x: number; y: number };
}>();

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    treaty,
    // @ts-expect-error leftover types field
    types: {},
});

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    metadata: z.object({ token: z.string() }),
    treaty,
});
void client.enter("test-room", { metadata: { token: "abc" } });

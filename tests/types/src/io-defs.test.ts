import { createClient, type PluvClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO, type IODefs } from "@pluv/io";
import { platformCloudflare, type CloudflarePlatform } from "@pluv/platform-cloudflare";
import type { InferIOInput, InferIOOutput, IOLikeDefs } from "@pluv/types";
import { expectTypeOf } from "expect-type";
import { z } from "zod";

expectTypeOf<IODefs>().toExtend<IOLikeDefs>();

const io = createIO()
    .platform(platformCloudflare())
    .config({
        authorize: {
            secret: "test-secret",
            user: z.object({
                id: z.string(),
                name: z.string(),
            }),
        },
        context: ({ env, meta, state }) => ({ env, meta, state }),
        crdt: yjs,
    });

const messages = io.router({
    sendMessage: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }, { context, platform, session }) => {
            expectTypeOf(session).not.toBeNullable();
            expectTypeOf(session.user).toEqualTypeOf<{ id: string; name: string }>();
            expectTypeOf(context).toEqualTypeOf<{
                env: {};
                meta: undefined;
                state: DurableObjectState;
            }>();
            expectTypeOf(platform).toEqualTypeOf<CloudflarePlatform>();

            return { receiveMessage: { message } };
        }),
});

const pings = io.router({
    ping: io.procedure.sync((_, { session }) => {
        expectTypeOf(session).toBeNullable();

        return { pong: {} };
    }),
});

const router = io.mergeRouters(messages, pings);
const ioServer = io.server({
    getInitialStorage: () => null,
    router,
});

const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
});
type InferredIO = typeof client extends PluvClient<infer TDefs> ? TDefs["io"] : never;
type InferredDefs = InferredIO["_defs"];

expectTypeOf<InferredDefs>().toHaveProperty("authorize");
expectTypeOf<InferredDefs>().toHaveProperty("crdt");
expectTypeOf<InferredDefs>().toHaveProperty("events");
expectTypeOf<"platform" extends keyof InferredDefs ? true : false>().toEqualTypeOf<false>();
expectTypeOf<"context" extends keyof InferredDefs ? true : false>().toEqualTypeOf<false>();

expectTypeOf<InferIOInput<InferredIO>["sendMessage"]>().toEqualTypeOf<{ message: string }>();
expectTypeOf<InferIOInput<InferredIO>["ping"]>().toEqualTypeOf<{}>();
expectTypeOf<InferIOOutput<InferredIO>["receiveMessage"]>().toEqualTypeOf<{ message: string }>();
expectTypeOf<InferIOOutput<InferredIO>["pong"]>().toEqualTypeOf<{}>();

const room = client.createRoom("test-room");

room.subscribe.event.receiveMessage((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{ message: string }>();
});
room.subscribe.event.pong((event) => {
    expectTypeOf(event.data).toEqualTypeOf<{}>();
});

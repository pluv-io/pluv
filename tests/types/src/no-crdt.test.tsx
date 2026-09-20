import { createClient } from "@pluv/client";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createTreaty } from "@pluv/treaty";
import type { InferIOTreaty } from "@pluv/types";
import { expectTypeOf } from "expect-type";
import { z } from "zod";

const treaty = createTreaty({
    user: z.object({ id: z.string() }),
});

// @ts-expect-error presence schema is required for presence procedures
void treaty.procedure.presence;
// @ts-expect-error storage schema is required for storage procedures
void treaty.procedure.storage;

const io = createIO().platform(platformCloudflare()).config({
    secret: "test-secret",
    treaty,
});

const ioServer = io.server({
    // @ts-expect-error
    getInitialStorage: () => null,
});

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    treaty,
    // @ts-expect-error
    initialStorage: {
        messages: [],
    },
});

const presenceTreaty = createTreaty({
    user: z.object({ id: z.string() }),
    presence: z.object({
        count: z.number(),
    }),
});

expectTypeOf(presenceTreaty.procedure).toHaveProperty("presence");
// @ts-expect-error storage schema is required for storage procedures
void presenceTreaty.procedure.storage;

const storageTreaty = createTreaty({
    user: z.object({ id: z.string() }),
    storage: yjs.schema({
        messages: yjs.yArray(s.string()),
    }),
});

expectTypeOf(storageTreaty.procedure).toHaveProperty("storage");
// @ts-expect-error presence schema is required for presence procedures
void storageTreaty.procedure.presence;

const addMessage = storageTreaty.procedure.storage.resolve((_, { storage }) => {
    storage.messages.push(["hello"]);
});

// @ts-expect-error storage procedures require a storage schema on the treaty
presenceTreaty.router({ addMessage });

expectTypeOf(storageTreaty).not.toExtend<InferIOTreaty<typeof ioServer>>();

createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    // @ts-expect-error client treaty must match the server treaty
    treaty: storageTreaty,
});

// @ts-expect-error treaty is required
createIO().platform(platformCloudflare()).config({});

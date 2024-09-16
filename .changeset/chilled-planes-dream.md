---
"@pluv/react": minor
---

Updated `createClient` and `createRoomBundle` object params to better support automatic type inference.

```ts
// Before
import { createClient } from "@pluv/react";
import { yjs } from "@pluv/crdt-yjs";
import { z } from "zod";
import type { ioServer } from "./server/ioServer";

const client = createClient<typeof ioServer>({
    authEndpoint: ({ room }) => "MY_AUTH_URL",
    wsEndpoint: ({ room }) => "MY_WEBSOCKET_URL",
});

client.createRoom("my-example-room", {
    presence: z.object({
        selectionId: z.string().nullish(),
    }),
    initialPresence: {
        selectionId: null,
    },
    initialStorage: yjs.doc(() => ({
        messages: yjs.array<string>([]),
    })),
});

// After

import { createBundle, createClient } from "@pluv/react";

const client = createClient({
    authEndpoint: ({ room }) => "MY_AUTH_URL",
    wsEndpoint: ({ room }) => "MY_WEBSOCKET_URL",
    /**
     * @description The ioServer type now needs to be inferred on this property
     * instead of within the generic on `createClient`. This is because of
     * limitations with TypeScript not yet supporting partial type-inference
     * for generics. Ensure to no-loonger include any generics on `createClient`
     */
    infer: (i) => ({ io: i<typeof ioServer> }),
    // Now moved to `createClient` from `PluvClient.createRoom`
    presence: z.object({
        selectionId: z.string().nullish(),
    }),
    /**
     * @description Now added to `createClient` to specify defaults for all
     * rooms, and to infer types for storage. This value will be overwritten by
     * `PluvClient.createRoom`.
     */
    initialStorage: yjs.doc(() => ({
        messages: yjs.array<string>([]),
    })),
});

const { createRoomBundle } = createBundle(client);
const pluv = createRoomBundle({});
```

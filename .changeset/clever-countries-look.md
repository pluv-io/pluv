---
"@pluv/platform-cloudflare": patch
"@pluv/platform-node": patch
---

Add support for adding metadata to context when creating a room.

```ts
import { createIO } from "@pluv/io";

// If using Cloudflare
import { platformCloudflare } from "@pluv/platform-cloudflare";

const io = createIO({
    // ...
    platform: platformCloudflare<CloudflareEnv, { myCustomData: string }>(),
    context: ({
        env,
        state,
        // This is now available on the context function
        meta,
    }) => ({ env, state, meta}),
});

const ioServer = io.server();

ioServer.createRoom("my-room", {
    // ...
    // This will now be a required property when creating a room
    meta: { myCustomData: "hello world" },
});

// If using Node.js
import { platformNode } from "@pluv/platform-node";

const io = createIO({
    // ...
    platform: platformNode<{ myCustomData: string }>(),
    context: ({
        // This is now available on the context function
        meta,
    }) => ({ env, state, meta}),
});

const ioServer = io.server();

ioServer.createRoom("my-room", {
    // ...
    // This will now be a required property when creating a room
    meta: { myCustomData: "hello world" },
});
```

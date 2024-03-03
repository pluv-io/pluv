---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/types": minor
"@pluv/io": minor
---

*BREAKING*: The `authorize` config when calling `createIO` can now also be a function that exposes the platform context.
This allows accessing the `env` in Cloudflare workers.

```ts
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { z } from "zod";

const io = createIO({
    authorize: ({ env }) => ({
        required: true,
        secret: env.PLUV_AUTHORIZE_SECRET,
        user: z.object({
            id: z.string(),
            name: z.string()
        }),
    }),
    platform: platformCloudflare<{ PLUV_AUTHORIZE_SECRET: string }>()
    // ...
});
```

This also requires that the platform contexts are passed to `io.createToken`.

```ts
// If using `platformNode`
await io.createToken({
    req, // This `IncomingMessage` is now required
    room,
    user: {
        id: "user_123",
        name: "john doe",
    },
});

// If using `platformCloudflare`
await io.createToken({
    env, // This env is now required from the handler's fetch function
    room,
    user: {
        id: "user_123",
        name: "john doe",
    },
});
```

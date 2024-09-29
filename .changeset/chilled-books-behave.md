---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/platform-pluv": minor
"@pluv/io": minor
---

Fixed platform context types. This will require additional properties when registering a websocket and creating authorization tokens. See example below:

```ts
// @pluv/platform-node example

import { platformNode } from "@pluv/platform-node";
import { createIO } from "@pluv/io";
import type { IncomingMessage } from "node:http";
import { z } from "zod";

const io = createIO({
    // If using a function authorize parameter, `req` is now available as a param
    authorize: ({ req }) => ({
        required: true,
        secret: "MY-CUSTOM-SECRET",
        user: z.object({
            id: z.string(),
        }),
    }),
    platformNode(),
});

// Before
io.createToken({
    room: "my-custom-room",
    user: { id: "abc123" },
});

// After
io.createToken({
    room: "my-custom-room",
    user: { id: "abc123" },

    // Previously not required, but now required
    req: req as IncomingMessage,
});
```

```ts
// @pluv/platform-cloudflare example

import { platformCloudflare } from "@pluv/platform-cloudflare";
import { createIO } from "@pluv/io";
import { z } from "zod";

const io = createIO({
    // If using a function authorize parameter, `env` and `request` are now available as params
    authorize: ({ env, request }) => ({
        required: true,
        secret: "MY-CUSTOM-SECRET",
        user: z.object({
            id: z.string(),
        }),
    }),
    platformCloudflare(),
});

// Before
io.createToken({
    room: "my-custom-room",
    user: { id: "abc123" },
});

// After
io.createToken({
    room: "my-custom-room",
    user: { id: "abc123" },

    // Previously not required, but now required
    env: env as Env,
    request: request as Request,
});
```

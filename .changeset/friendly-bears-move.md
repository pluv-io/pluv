---
"@pluv/platform-pluv": minor
---

**BREAKING**: The API has been updated to now be called as function `platformPluv` into `createIO` from `@pluv/io`.

```ts
// Before

import { createIO } from "@pluv/platform-pluv";

export const io = createIO({
    authorize: {
        user: z.object({
            id: z.string(),
        }),
    },
    basePath: "/api/pluv",
    publicKey: "pk_...",
    secretKey: "sk_...",
    webhookSecret: "whsec_...",
});

export const GET = pluv.handler;

// After

import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform-pluv";

export const io = createIO({
    authorize: {
        user: z.object({
            id: z.string(),
        }),
    },
    platform: platformPluv({
        basePath: "/api/pluv",
        publicKey: "pk_...",
        secretKey: "sk_...",
        webhookSecret: "whsec_...",
    }),
});

export const ioServer = io.server();

// Example: If you're on Next.js
export const GET = ioServer.fetch;
```

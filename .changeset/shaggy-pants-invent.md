---
"@pluv/client": patch
---

Added support for specifying the `publicKey` param for `createClient` as a function with metadata. This is particularly useful for non-static Next.js applications built with Cloudflare Pages.

```ts
import { createClient } from "@pluv/client";
import { z } from "zod";

export const client = createClient({

    // Can be a string
    publicKey: "pk_abc123...",

    // Or can be a function
    metadata: z.object({
        publicKey: z.string().min(1, "Required"),
    }),
    publicKey: ({ metadata }) => metadata.publicKey,
});
```


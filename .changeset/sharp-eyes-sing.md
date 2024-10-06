---
"@pluv/client": patch
---

Add `register` helper to improve client initialization when hosted on pluv.io.

```ts
import { createClient, register } from "@pluv/client";
import type { ioServer } from "./server";

const client = createClient({
    infer: (i) => ({ io: i<typeof ioServer> }),
    // This includes `wsEndpoint` and therefore should no-longer be manually provided
    ...register({
        // `authEndpoint` and `publicKey` are now required
        authEndpoint: ({ room }) => `${process.env.API_URL}/api/room?room=${room}`,
        publicKey: "pk_...",
    }),
});
```

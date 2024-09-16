---
"@pluv/react": patch
---

Added client-side event router. This more-or-less mirrors the server-side event router. You can use both the server-side and client-side router simultaneously, but you should generally prefer only using one or the other.

```ts
// Backend Server
import { createIO } from "@pluv/io";

const io = createIO({ /* ... */ });
const ioServer = io.server({
    router: io.router({
        multiply2: io.procedure
            .input(z.object({ value: z.number() }))
            .broadcast(({ value }) => ({
                multiplied2: { value: value * 2 },
            })),
    }),
});

// Frontend Client
import { createBundle createClient } from "@pluv/react";

const io = createClient({ /* ... */ });

const { createRoomBundle } = createBundle(io);
const pluv = createRoomBundle({
    // ...
    router: io.router({
        add5: io.procedure
            .input(z.object({ value: z.number() }))
            .broadcast(({ value }) => ({
                /**
                 * @description Because `ioServer` does not specify `added5`,
                 * this will be forwarded to connected peers.
                 */
                added5: { value: value + 5 },
            })),
        /**
         * @description This is possible, but not recommended to do. Because
         * `multiply2` is a procedure on `ioServer`, this will trigger the
         * `multiply2` procedure on `ioServer`. Connected peers will not
         * receive `multiply2`, but rather `multipled2`.
         */
        subtract5Multiply2: io.procedure
            .input(z.object({ value: z.number() }))
            .broadcast(({ value }) => ({
                multiply2: { value: value - 5 },
            })),
    }),
});
```

---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/client": minor
"@pluv/react": minor
"@pluv/types": minor
"@pluv/io": minor
---

## Breaking Changes

* `@pluv/io` has been updated to introduce `PluvProcedure`, `PluvRouter` and `PluvServer`. This change is intended to improve the ergonomics of declaring events and simplifying inferences of event types.

### Before:

```ts
// backend/io.ts

import { createIO } from "@pluv/io";
import {
    createPluvHandler,
    platformNode,
} from "@pluv/platform-node";
import { z } from "zod";

export const io = createIO({
    platform: platformNode(),
}).event("SEND_MESSAGE", {
    input: z.object({ message: z.string() }),
    resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
}).event("DOUBLE_VALUE", {
    input: z.object({ value: z.number() }),
    resolver: ({ value }) => ({ VALUE_DOUBLED: { value: value * 2 } }),
});

const Pluv = createPluvHandler({
    io,
    /* ... */
});
```

```ts
// frontend/pluv.ts

import { createClient } from "@pluv/react";
import type { io } from "../backend/io";

const client = createClient<typeof io>({ /* ... */ });
```

### Now:

```ts
import { createIO } from "@pluv/io";
import {
    createPluvHandler,
    platformNode,
} from "@pluv/platform-node";
import { z } from "zod";

const io = createIO({
    platform: platformNode(),
});

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({
            RECEIVE_MESSAGE: { message },
        })),
    DOUBLE_VALUE: io.procedure
        .input(z.object({ value: z.number() }))
        .broadcast(({ value }) => ({
            VALUE_DOUBLED: { value: value * 2 },
        })),
});

export const ioServer = io.server({ router });

const Pluv = createPluvHandler({
    io: ioServer, // <- This uses the PluvServer now
    /* ... */
});
```

```ts
// frontend/pluv.ts

import { createClient } from "@pluv/react";
import type { ioServer } from "../backend/io";

// This users the PluvServer type now
const client = createClient<typeof ioServer>({ /* ... */ });
```

* `PluvRouter` instances can also be merged via the `mergeRouters` method, which effectively performs an `Object.assign` of the events object and returns a new `PluvRouter` with the correct types:

```ts
const router = io.mergeRouters(router1, router2);
```

---
"@pluv/client": minor
---

TypeScript will now emit an error if `initialStorage` was provided to `createClient` while `createIO` was not provided a `crdt`.

```ts
import { createClient, infer } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

const io = createIO(
  // Assume no crdt was provided here
  platformCloudflare({ /* ... */})
);

const ioServer = io.server();

const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
  types,
  // This will now emit a TypeScript error, because `crdt` was not provided to
  // `createIO` above
  initialStorage: yjs.doc((t) => ({
    groceries: t.array<string>("groceries"),
  })),
});
```

---
"@pluv/crdt-yjs": minor
---

Added a `provider` function that satisfies Yjs's provider interface.

```ts
import { createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";

const client = createClient({ /* ... */ });
const room = client.createRoom("example-room");

// Yjs Provider
yjs.provider({ room });
```

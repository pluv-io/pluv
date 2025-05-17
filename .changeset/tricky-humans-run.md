---
"@pluv/crdt-yjs": minor
---

Added an `awareness` function that satisfies Yjs's [awareness interface](https://github.com/yjs/y-protocols/blob/master/awareness.js).

```ts
import { createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";

const client = createClient({ /* ... */ });
const room = client.createRoom("example-room");

// Yjs Awareness
yjs.awareness({ room, /* ... */ });
```

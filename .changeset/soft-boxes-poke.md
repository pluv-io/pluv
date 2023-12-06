---
"@pluv/client": minor
---

Added `getDoc` on `PluvRoom` to access the root Yjs doc.

```ts
import { createClient } from "@pluv/client";
import type { Doc } from "yjs";

const client = createClient(/* ... */);
const room = client.createRoom(/* ... */);

const doc: Doc = room.getDoc();
```

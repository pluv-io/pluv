---
"@pluv/client": minor
---

Updated typings for `PluvRoom.getDoc` to be narrower to get the native doc type.

```ts
import { createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import type { Doc as YDoc } from "yjs";

const client = createClient({
    // ...
    crdt: yjs,
});
const room = client.createRoom("example-room");

const doc = room.getDoc();

// This is now typed as the native YDoc
doc.value
//  ^? const value: YDoc
```

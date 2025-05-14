---
"@pluv/react": minor
---

Updated typings for `useDoc` to be narrower to get the native doc type.

```ts
import { createClient } from "@pluv/client";
import { yjs } from "@pluv/crdt-yjs";
import { createBundle } from "@pluv/react";
import type { Doc as YDoc } from "yjs";

const client = createClient({
    // ...
    crdt: yjs,
});
const { useDoc } = createBundle(client);

const doc = useDoc();

// This is now typed as the native YDoc
doc.value
//  ^? const value: YDoc
```

---
"@pluv/react": minor
---

Added a new type `InferBundleRoom` to get the type of the `PluvRoom` from the react bundle that is created.

```ts
import { createClient } from "@pluv/client";
import type { InferBundleRoom } from "@pluv/react";
import { InferBundleRoom } from "@pluv/react";

const client = createclient({ /* ... */ });

const bundle = createBundle(client);

type RoomType = InferBundleRoom<typeof bundle>;

const { useStorage } = bundle;
```

---
"@pluv/client": minor
---

**BREAKING**
Updated how `createClient` infers the `PluvServer` type (again 🙁). The property to specify the type-inferred `PluvServer` type has been renamed to `types` from `infer`. `@pluv/client` now exports a function called `infer` that must now be used to construct the inferred `types` property. `infer` must be called before, and outside of `createClient` due to TypeScript inferrence limitations. See examples below:

```ts
// Before

import { createClient } from "@pluv/client";
import type { ioServer } from "../server/pluv";

const client = createClient({
    // ...
    infer: (i) => ({ io: i<typeof ioServer> }),
    // ...
});

// After

import { createClient, infer } from "@pluv/client";
import type { ioServer } from "../server/pluv";

// Observe that `types` is initialized outside of `createClient`, instead of
// inline within the `createClient` function.`
const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    // ...
    // Avoid calling `infer` inline within this function like in the commented
    // example below:
    // types: infer((i) => ({ io: i<typeof ioServer> })),
    types,
    // ...
});
```

---
"@pluv/react": minor
---

**BREAKING**

Removed re-exports of `@pluv/client` and `@pluv/crdt` parts from `@pluv/react`.

```ts
// Before

import { createBundle, createClient } from "@pluv/react";

// After

import { createClient } from "@pluv/client";
import { createBundle } from "@pluv/react";

```

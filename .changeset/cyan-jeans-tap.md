---
"@pluv/io": patch
---

Update `getInitialStorage` so that the context is made available on the `context` event property.

```ts
import { createIO } from "@pluv/io";

// Before
const io = createIO({
    getInitialStorage: ({ room, ...context }) => {
        // ...
    },
});

// After
const io = createIO({
    // Context is now an explicit property on the event
    getInitialStorage: ({ room, context }) => {
        // ...
    },
});
```

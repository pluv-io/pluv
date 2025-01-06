---
"@pluv/io": minor
---

**BREAKING**

Removed the `required` property on the `authorize` config when creating a `PluvIO` instance. When `authorize` is provided, the session will be required to be authorized.

```ts
// Before
import { z } from "zod";

const io = createIO({
    // ...
    authorize: {
        // Previously required: true to force all users to authorize
        required: true,
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
        secret: "sk_...",
    },
    // ...
});

// After

const io = createIO({
    // ...
    authorize: {
        // No more `required` property. Now automatically applied always if
        // `authorize` prop is provided to `createIO`
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
        secret: "sk_...",
    },
    // ...
});
```

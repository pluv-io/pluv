---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
---

**BREAKING**

Update `authorize` params so that `roomId` is renamed to `room` and more platform-specific parameters are exposed. See example below:

```ts
// @pluv/platform-cloudflare example
import { createPluvHandler } from "@pluv/platform-cloudflare";

// Before
createPluvHandler({
    // ...
    authorize: ({ roomId }) => {
        // ...
    },
});

// After
createPluvHandler({
    // ...
    authorize: ({ env, request, room }) => {
        // ...
    },
});
```

```ts
// @pluv/platform-node example
import { createPluvHandler } from "@pluv/platform-node";

// Before
createPluvHandler({
    // ...
    authorize: ({ roomId }) => {
        // ...
    },
});

// After
createPluvHandler({
    // ...
    authorize: ({ req, room }) => {
        // ...
    },
});
```

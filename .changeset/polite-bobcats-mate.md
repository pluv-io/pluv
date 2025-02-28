---
"@pluv/platform-pluv": minor
---

**BREAKING**

Updated the `platformPluv` function to return an entire `createIO` input object. Now `createIO` must be called with `platformPluv`'s return value as an input.

```ts
// Before

import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform-pluv";

export const io = createIO({
    authorize: {
        // ...
    },
    context: {
        // ...
    },
    platform: platformPluv({
        // ...
    }),
    // ...
});

// After

import { createIO } from "@pluv/io";
import { platformPluv } from "@pluv/platform-pluv";

export const io = createIO(
    platformPluv({
        authorize: {
            // ...
        },
        context: {
            // ...
        },
    }),
);

```

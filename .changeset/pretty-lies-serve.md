---
"@pluv/platform-cloudflare": minor
---

**BREAKING**

Updated the `platformCloudflare` function to return an entire `createIO` input object. Now `createIO` must be called with `platformCloudflare`'s return value as an input.

```ts
// Before

import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";

export const io = createIO({
    authorize: {
        // ...
    },
    context: {
        // ...
    },
    platform: platformCloudflare<Env, Meta>({
        // ...
    }),
    // ...
});

// After

import { createIO } from "@pluv/io";
import { infer, platformCloudflare } from "@pluv/platform-cloudflare";

// Types must now be inferred like so, due to TypeScript limitations around partial inferences
// Note that this types variable is defined outside of the `createIO` function
const types = infer((i) => ({
    env: i<Env>,
    meta: i<Meta>,
}));
export const io = createIO(
    platformCloudflare({
        authorize: {
            // ...
        },
        context: {
            // ...
        },
        // Optional: Pass inferred types here
        types,
        // ...
    }),
);

```

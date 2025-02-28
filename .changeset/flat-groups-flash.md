---
"@pluv/platform-node": minor
---

**BREAKING**

Updated the `platformNode` function to return an entire `createIO` input object. Now `createIO` must be called with `platformNode`'s return value as an input.

```ts
// Before

import { createIO } from "@pluv/io";
import { platformNode } from "@pluv/platform-node";

export const io = createIO({
    authorize: {
        // ...
    },
    context: {
        // ...
    },
    platform: platformNode<Meta>({
        // ...
    }),
    // ...
});

// After

import { createIO } from "@pluv/io";
import { infer, platformNode } from "@pluv/platform-node";

// Types must now be inferred like so, due to TypeScript limitations around partial inferences
// Note that this types variable is defined outside of the `createIO` function
const types = infer((i) => ({
    meta: i<Meta>,
}));
export const io = createIO(
    platformNode({
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

---
"@pluv/io": minor
---

**BREAKING**

Update `createIO`'s `context` property to allow lazy initialization as a function. The `context` also no-longer contains platform-specific values by default. See example below:

```ts
import { createIO } from "@pluv/io";
import { platformCloudflare } from "@pluv/platform-cloudflare";
import { Database } from "./database";

// Before
const io = createIO({
    platform: platformCloudflare(),
    context: {
        // Maybe you need to access `env` for Cloudflare, but it's not accessible
        // here
        db: new Database(env.DATABASE_URL),
                      // ^ Does not exist
        
        // Even though it's not specified in this `context`, Cloudflare's
        // env and state values were previously available where context
        // was referenced
    },
});

// After
const io = createIO({
    platform: platformCloudfare(),
    context: ({ env, state }) => ({
        db: new Database(env.DATABASE_URL),
                      // ^ Now accessible
        
        // Now these must be forwarded to use them
        env,
        state,
    }),
});
```

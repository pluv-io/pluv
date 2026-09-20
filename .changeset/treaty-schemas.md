---
"@pluv/treaty": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/types": major
"@pluv/crdt": major
"@pluv/crdt-yjs": major
"@pluv/crdt-loro": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/platform-pluv": major
"@pluv/addon-indexeddb": major
---

Define user, presence, and storage once as a **treaty**, then import the same value on the server and the client.

You no longer split schemas across `authorize.user`, `createIO({ crdt })`, and `createClient({ presence, storage })`. Optional presence/storage procedures can live on the treaty for typing; they are not a room API yet.

```ts
// shared/treaty.ts
import { createTreaty } from "@pluv/treaty";
import { s } from "@pluv/crdt";
import { yjs } from "@pluv/crdt-yjs";
import { z } from "zod";

export const treaty = createTreaty({
    user: z.object({
        id: z.string(),
        name: z.string(),
    }),
    presence: z.object({
        selectionId: z.string().nullable(),
    }),
    storage: yjs.schema({
        messages: yjs.yArray(s.string()),
    }),
});
```

```ts
// Before
const io = createIO()
    .platform(platformNode())
    .config({
        authorize: { secret, user: schema },
        context: () => ({ db }),
    });

const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    presence: z.object({ selectionId: z.string().nullable() }),
    storage: yjs.storage({
        schema: yjs.schema({ messages: yjs.yArray(s.string()) }),
    }),
    initialStorage: { messages: [] },
});

// After
const io = createIO()
    .platform(platformNode())
    .config({
        treaty,
        secret,
        context: () => ({ db }),
    });

const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    treaty,
    initialStorage: { messages: [] },
});
```

`yjs.schema` / `loro.schema` are the storage factories (`yjs.storage` / `loro.storage` are removed). Node and Cloudflare still pass `secret` on `.config()`. Hosted `platformPluv` omits `secret` (`secretKey` stays on `platformPluv(...)`).

Use `createClient<typeof ioServer>()` when you need server event types. `createClient().config({ treaty, ... })` still works without a server type; pass the runtime treaty so presence and storage infer correctly.

Treaty user, presence, and client metadata must use Zod 4.2+ or ArkType (Standard Schema and Standard JSON Schema on the same object). See the standard-schema validators changeset for the full validator list.

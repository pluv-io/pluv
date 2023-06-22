---
"@pluv/addon-indexeddb": minor
"@pluv/crdt-yjs": minor
"@pluv/client": minor
"@pluv/react": minor
"pluv": minor
"@pluv/io": minor
---

Added support for defining persistant frontend storage for rooms via a new `addons` option on rooms.

This also introduces the first new addon `@pluv/addon-indexeddb`, which is more-or-less the equivalent to `y-indexeddb` which you can install like so:

```
npm install @pluv/addon-indexeddb
```

To use this new addon, simply pass it to options when creating a room:

```ts
import { addonIndexedDB } from "@pluv/addon-indexeddb";
import { createClient } from "@pluv/client";

const client = createClient({
    // ...
});

const room = client.createRoom("my-new-room", {
    addons: [
        // Define your addons in an array like so
        addonIndexedDB(),
    ],
});
```

Or when using `@pluv/react`:

```ts
const PluvRoom = createRoomBundle({
    // ...
    addons: [
        // Define your addons in an array like so
        addonIndexedDB(),
    ],
});
```

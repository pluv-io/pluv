---
"@pluv/io": minor
---

* Fixed errors thrown when using Cloudflare's websocket hibernation API caused by rooms being re-used between different instances of DurableObjects.
* Add configurable `onDelete` and `onMessage` event listeners that can be set when rooms are created.

**BREAKING**

* Changed `PluvServer.getRoom` to `PluvServer.createRoom`. This means `PluvServer` only handles room creation. Room management must now be handled manually. This mainly affects manually creating rooms with `@pluv/platform-node`, and will likely not affect you if you are either using `createPluvHandler` on any platform, or if you are using `@pluv/platform-cloudflare`.

```ts
// For @pluv/platform-node

// Before

import { createIO } from "@pluv/io";

const io = createIO(/* ... */);
const ioServer = io.server(/* ... */);

const roomId = "my-room-id";
const room = ioServer.getRoom(roomId);

// After

import { createIO, type InferIORoom } from "@pluv/io";

const io = createIO(/* ... */);
const ioServer = io.server(/* ... */);

const rooms = new Map<string, InferIORoom<typeof ioServer>>();

const roomId = "my-room-id";
const room = ioServer.createRoom(roomId, {
    // Use new onDelete event listener
    onDelete: (event) => {
        rooms.delete(event.room);
    },
});

rooms.set(roomId, room);
```

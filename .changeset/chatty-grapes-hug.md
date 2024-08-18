---
"@pluv/io": minor
---

**BREAKING**

Moved `getInitialStorage`, `onRoomDeleted` and `onStorageUpdated` from `createIO` to `PluvIO.server`.

```ts
import { createIO } from "@pluv/io";

// Before
const io = createIO({
    // ...
    getInitialStorage: (event) => {
        // ...
    },
    onRoomDeleted: (event) => {
        // ...
    },
    onStorageUpdated: (event) => {
        // ...
    },
    // ...
});

const ioServer = io.server({
    // ...
});

// After
const io = createIO({
    // ...
});

const ioServer = io.server({
    // ...
    getInitialStorage: (event) => {
        // ...
    },
    onRoomDeleted: (event) => {
        // ...
    },
    onStorageUpdated: (event) => {
        // ...
    },
    // ...
});
```

Added a new listener `onRoomMessage` to `PluvIO.server` to listen to events that are sent within a room.

```ts
const ioServer = io.server({
    // ...
    onRoomMessage: (event) => {
        console.log(event.message);
        console.log(event.user);
    },
    // ...
});
```

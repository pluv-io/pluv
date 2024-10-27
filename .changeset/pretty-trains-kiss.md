---
"@pluv/platform-pluv": patch
"@pluv/io": patch
---

Add `onUserConnected` and `onUserDisconnected` events on `PluvServer`.

```ts
import { createIO } from "@pluv/io";

const io = createIO({ /* ... */ });

const ioServer = io.server({
    // ...
    onUserConnected: (event) => {
        // ...
    },
    onUserDisconnected: (event) => {
        // ...
    },
});
```

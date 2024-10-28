---
"@pluv/platform-pluv": patch
---

Validate webhook signatures via webhook secrets.

```ts
import { createIO } from "@pluv/platform-pluv";

const io = createIO({
    // ...
    // If you provide a webhookSecret
    webhookSecret: "whsec_...",

    // The following properties will be made available to configure
    getInitialStorage: (event) => { /* ... */ },
    onRoomDeleted: (event) => { /* ... */ },
    onUserConnected: (event) => { /* ... */ },
    onUserDisconnected: (event) => { /* ... */ },
});
```

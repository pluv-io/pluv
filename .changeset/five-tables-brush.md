---
"@pluv/client": minor
---

**DEPRECATED** `PluvRoom.event`, `PluvRoom.storage`, `PluvRoom.storageRoot` and `PluvRoom.other` have all been deprecated, to be removed in v3. These now exist under `PluvRoom.subscribe` instead.

```ts
const room = client.createRoom("example-room");

// Before (now deprecated)
room.event.receiveMessage((event) => {});
room.storage.messages((messages) => {});
room.storageRoot((storage) => {});
room.other(("id_...", other) => {});

// After
room.subscribe.event.receiveMessage((event) => {});
room.subscribe.storage.messages((messages) => {});
room.subscribe.storageRoot((storage) => {});
room.subscribe.other(("id_...", other) => {});
```

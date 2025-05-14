---
"@pluv/client": minor
---

**DEPRECATED** `PluvRoom.storageLoaded` will be removed in v3. Added `PluvRoom.getStorageLoaded` with improved detection of when the storage was synced.

```ts
const room = client.createRoom("example-room");

room.getStorageLoaded
```

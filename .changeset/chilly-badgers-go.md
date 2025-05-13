---
"@pluv/client": minor
---

**DEPRECATED** Subscribing to data via string parameters on `PluvRoom.subscribe` is deprecated, to be removed in v3. To subscribe to things such as `myself`, `my-presence` and `others`, you must now do so via nested properties on the `subscribe` object (see example below).

```ts
const room = client.createRoom("example-room");

// Before (now deprecated)
room.subscribe("connection", (state) => {});
room.subscribe("my-presence", (myPresence) => {});
room.subscribe("myself", (myself) => {});
room.subscribe("others", (others) => {});
room.subscribe("storage-loaded", (storageLoaded) => {});

// After
room.subscribe.connection((state) => {});
room.subscribe.myPresence((myPresence) => {});
room.subscribe.myself((myself) => {});
room.subscribe.others((others) => {});
room.subscribe.storageLoaded((storageLoaded) => {});
```

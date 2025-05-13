---
"@pluv/client": minor
---

Updated `PluvRoom.subscribe` so that `PluvRoom.event` and `PluvRoom.storage` can be accessed as properties under `PluvRoom.subscribe`.

```ts
const room = client.createRoom("example-room");

// These are now available under the subscribe object
room.subscribe.event.receiveEvent((event) => {});
room.subscribe.storage.messages((data) => {});
```

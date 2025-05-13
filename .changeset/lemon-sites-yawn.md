---
"@pluv/client": minor
---

Updated `PluvRoom.storage` to also allow subscribing to storage fields as nested properties.

```ts
const client = createClient({
    // ...
    initialStorage: yjs.doc((t) => ({
        messages: yjs.array<string>(),
    })),
});

const room = client.createRoom("example-room");

// The two statements below are equivalent.
room.storage("messages", (value) => {});

// You can now subscribe to storage fields as nested properties like so
room.storage.messages((value) => {});
```

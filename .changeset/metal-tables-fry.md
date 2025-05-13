---
"@pluv/client": minor
---

Updated `PluvRoom.storage` to also allow subscribing to the root storage when no field is provided.

```ts
const client = createClient({
    // ...
    initialStorage: yjs.doc((t) => ({
        messages: yjs.array<string>(),
    })),
});

const room = client.createRoom("example-room");

room.storage("messages", (value) => {});
//                        ^? const value: string[];

// You can now subscribe to the storage root when no key is provided
room.storage((value) => {});
//            ^? const value: { messages: string[] };
```

---
"@pluv/client": minor
---

**BREAKING** Moved the `metadata` parameter from `PluvClient.createRoom` to `PluvClient.enter`.

```ts
// Before
const room = client.createRoom({
    // ...
    metadata: { hello: "world" },
    // ...
});

client.enter(room);

// After
const room = client.createRoom({
    // ...
});

client.enter(room, { metadata });
```

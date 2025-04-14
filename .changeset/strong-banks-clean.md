---
"@pluv/client": minor
---

**BREAKING** Moved the `metadata` parameter from the constructor of `PluvRoom` to `PluvClient.connect`. The `metadata` parameter from the constructor of `PluvRoom` is now the validation schema for `metadata` passed through from `PluvClient`.

This should not be breaking for most users, as the recommended way to enter a room has always been via `PluvClient.enter(room)` (i.e. these are mostly internal-only changes).

```ts
// Before
const room = new Room("my-room", { metadata: { hello: "world" } });

await room.connect();

// After
const room = new Room("my-room", {
    metadata: z.object({ hello: z.string() }),
});

await room.connect({ metadata: { hello: "world" } });
```

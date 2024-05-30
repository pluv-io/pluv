---
"@pluv/react": minor
---

Added broadcast proxy as a new way to broadcast events to other users.

```tsx
// backend

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

// frontend
const pluv = createRoomBundle(/* ... */);

const broadcast = pluv.useBroadcast();

// Both of the examples below are equivalent.

broadcast("SEND_MESSAGE", { message: "Hello world~!" });

broadcast.SEND_MESSAGE({ message: "Hello world~!" });
```

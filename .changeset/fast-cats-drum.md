---
"@pluv/io": minor
---

Added broadcast proxy as a new way to broadcast events to a room.

```tsx
// backend

const io = createIO({ /* ... */ });


const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

const ioServer = io.server({ router });

const room = ioServer.getRoom("MY_EXAMPLE_ROOM");

// Both of the examples below are equivalent.

room.broadcast("SEND_MESSAGE", { message: "Hello world~!" });

room.broadcast.SEND_MESSAGE({ message: "Hello world~!" });
```

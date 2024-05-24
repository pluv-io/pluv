---
"@pluv/client": patch
---

Added broadcast proxy as a new way to broadcast events.

```ts
// backend

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

// frontend
const client = createClient(/* ... */);

// Both of the examples below are equivalent.

client.broadcast("SEND_MESSAGE", { message: "Hello world~!" });

client.broadcast.SEND_MESSAGE({ message: "Hello world~!" });
```

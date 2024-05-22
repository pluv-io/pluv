---
"@pluv/client": patch
---

Added event proxy as a new way to invoke event procedures.

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

client.event("RECEIVE_MESSAGE", ({ data }) => {
    const { message } = data;

    console.log(message);
});

client.event.RECEIVE_MESSAGE(({ data }) => {
    const { message } = data;

    console.log(message);
});
```

---
"@pluv/react": patch
---

Added event proxy as a new way to listen to events.

```tsx
// backend

const router = io.router({
    SEND_MESSAGE: io.procedure
        .input(z.object({ message: z.string() }))
        .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
});

// frontend
const pluv = createRoomBundle(/* ... */);

// Both of the examples below are equivalent.

pluv.useEvent("RECEIVE_MESSAGE", ({ data }) => {
    const { message } = data;

    console.log(message);
});

pluv.event.RECEIVE_MESSAGE.useEvent(({ data }) => {
    const { message } = data;

    console.log(message);
});
```

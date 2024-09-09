---
"@pluv/io": patch
---

Events without a procedure will now automatically be passed-through to connected peers as-if they were broadcast.

```tsx
// backend

const io = createIO({ /* ... */ });

const ioServer = io.server({
    router: io.router({
        sendGreeting: io.procedure
            .input(z.object({ name: z.string() }))
            .broadcast(({ name }) => ({
                receiveGreeting: { greeting: `Hi, I'm ${name}!` }
            })),
    }),
});

// frontend

const broadcast = useBroadcast();

// This will be captured in the server procedure and emit receiveGreeting
broadcast.sendGreeting({ name: "leedavidcs" });

event.receiveGreeting.useEvent(({ data }) => {
    console.log(data.greeting);
});

// This is not captured by any server procedure and will be broadcast to peers as-is

broadcast.myCustomUncaughtEvent({ randomData: "Hello world!" });

// This will be be received by all connections, passed as-is from the server
event.myCustomUncaughtEvent.useEvent(({ data }) => {
    console.log(data.randomData);
});
```

---
"@pluv/client": minor
---

**BREAKING**

Moved `authEndpoint` and `wsEndpoint` from `createClient` to `PluvClient.createRoom`.

```ts
// Before
const client = createClient<typeof ioServer>({
    authEndpoint: (room: string) => "MY_AUTH_ENDPOINT",
    wsEndpoint: (room: string) => "MY_WS_ENDPOINT",
});

client.createRoom({
    // ...
});

// After
const client = createClient<typeof ioServer>();

client.createRoom({
    authEndpoint: (room: string) => "MY_AUTH_ENDPOINT",
    wsEndpoint: (room: string) => "MY_WS_ENDPOINT",
    // ...
});
```

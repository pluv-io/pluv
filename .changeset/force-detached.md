---
"@pluv/io": major
"@pluv/platform-cloudflare": major
"@pluv/platform-node": major
"@pluv/platform-pluv": major
---

Node rooms only accept the socket in `register`. Forward `message`, `close`, and `error` yourself, and attach those listeners before awaiting `register`.

`ws` drops frames that arrive with no listener. `register` does not return until authorization and storage finish, so a listener added afterward misses anything the client already sent. Calling only `register` accepts the connection and then ignores later messages. Cloudflare already forwards those events from the Durable Object and does not need a new handler.

```ts
// Before
wsServer.on("connection", async (ws, req) => {
    await room.register(ws, { request: req, token });
});

// After
wsServer.on("connection", async (ws, req) => {
    ws.on("message", async (data) => {
        await room.onMessage(ws)({ data });
    });
    ws.on("close", async (code, reason) => {
        await room.onClose(ws)({ code, reason: reason.toString() });
    });
    ws.on("error", async (error) => {
        await room.onError(ws)({ error, message: error.message });
    });

    await room.register(ws, { request: req, token });
});
```

`platformNode({ mode })` is removed. `"attached"` and `"detached"` are no longer options.

```ts
// Before
const io = createIO().platform(platformNode({ mode: "detached" }));

// After
const io = createIO().platform(platformNode());
```

`WebSocketRegistrationMode` is removed from `@pluv/io`.

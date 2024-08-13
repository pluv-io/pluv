---
"@pluv/platform-cloudflare": minor
"@pluv/io": minor
---

**BREAKING**: Require `DurableObjectState` in `ioServer.getRoom`.

```ts
// Before

// With platform-cloudflare
ioServer.getRoom(websocket, { env, req });
```

```ts
// Now

// With platform-cloudflare
ioServer.getRoom(websocket, { env, req, state });
```

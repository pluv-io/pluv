---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/io": minor
---

**BREAKING**: The original request object is no longer available in the context of any event resolvers.

Previously, the request object that was passed into `PluvServer.getRoom` would be made available on the context object of each of the resolvers. This is no-longer a part of the event context, and therefore needs to be omitted from calls to `PluvServer.getRoom`.

```ts
// Before

// With platform-node
ioServer.getRoom(websocket, { req, token });

// With platform-cloudflare
ioServer.getRoom(websocket, { env, req, token });
```

```ts
// Now

// With platform-node
ioServer.getRoom(websocket, { req });

// With platform-cloudflare
ioServer.getRoom(websocket, { env, req });
```

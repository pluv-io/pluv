---
"@pluv/client": major
"@pluv/react": major
"@pluv/io": major
"@pluv/types": major
"@pluv/crdt-yjs": major
---

Remove `@pluv/platform-pluv` and client event routers.

Custom events are defined with `io.procedure` and `io.router`. `room.broadcast` and event subscriptions use that server router. `createClient().procedure`, `createClient().router`, `createRoom({ router })`, and `createBundle({ router })` are removed.

`@pluv/platform-pluv` is removed, including webhook listeners, `ioServer.fetch`, publishable keys, and the default `rooms.pluv.io` websocket. Run rooms with `@pluv/platform-node`, `@pluv/platform-cloudflare`, or `@pluv/platform`. Pass `secret` on `.config()`, and pass `authEndpoint` and `wsEndpoint` on the client. `HandleMode`, `ListenerMode`, and `PlatformConfig` are removed.

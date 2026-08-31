---
"@pluv/io": patch
---

Fixed `garbageCollect`, `evict`, `evictAll` and `broadcast` resolving before their work finished. Websocket closes, `persistence.deleteUser`, `$exit` broadcasts and pub/sub publishes could still be in flight after awaiting them. If you `await room.garbageCollect()` from a Cloudflare Durable Object alarm handler, that cleanup could be cut short when the isolate is evicted.

The `$pong` heartbeat reply is now sent before periodic garbage collection, so the newly awaited cleanup cannot delay it past the client's pong timeout.

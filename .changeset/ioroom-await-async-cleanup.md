---
"@pluv/io": patch
---

Fixed `IORoom.garbageCollect`, `IORoom.evict` and `IORoom.evictAll` resolving before the cleanup they schedule has finished. These methods previously returned once sessions were removed from the in-memory map, while websocket closes, `persistence.deleteUser`, `$exit` broadcasts, `onUserDisconnected`, and room teardown (`onRoomDestroyed`, `onStorageDestroyed`) were still in flight. This mattered most on Cloudflare Durable Objects, where the documented pattern is to `await room.garbageCollect()` from an alarm handler — the isolate could be evicted once the handler returned, truncating the cleanup that had not been awaited.

Fixed `IORoom.broadcast` resolving before the message was published to pub/sub. With `@pluv/pubsub-redis` the publish is a network round-trip, so the returned promise did not cover delivery to other nodes.

The `$pong` heartbeat reply is now sent before periodic garbage collection runs, rather than after. Because garbage collection is now awaited, running it first would have blocked the reply behind websocket closes and persistence writes, risking the client's 2 second pong timeout and a spurious reconnect.

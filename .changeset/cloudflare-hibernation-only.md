---
"@pluv/platform-cloudflare": major
"@pluv/persistence-cloudflare-transactional-storage": major
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-pluv": major
---

Require Cloudflare WebSocket hibernation and SQLite-backed Durable Object storage.

`platformCloudflare({ mode: "attached" })` (standard WebSocket API listeners) is no longer supported. Durable Objects must implement `webSocketMessage`, `webSocketClose`, and `webSocketError` and forward them to the room.

Key-value Durable Object storage is no longer supported. `PersistenceCloudflareTransactionalStorage({ mode: "kv" })` has been removed; persistence always uses SQLite. Create rooms with `new_sqlite_classes` (or `"storage": "sqlite"`). Existing KV-backed namespaces need a new SQLite Durable Object class and a data move—Cloudflare does not offer an in-place storage-backend switch.

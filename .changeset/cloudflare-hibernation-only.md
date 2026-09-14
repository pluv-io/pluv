---
"@pluv/platform-cloudflare": major
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-pluv": major
---

Require Cloudflare WebSocket hibernation; remove `mode` from `platformCloudflare`.

`platformCloudflare({ mode: "attached" })` (standard WebSocket API listeners) is no longer supported. Durable Objects must implement `webSocketMessage`, `webSocketClose`, and `webSocketError` and forward them to the room. Key-value Durable Object storage still works via `@pluv/persistence-cloudflare-transactional-storage`.

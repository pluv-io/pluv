---
"@pluv/io": major
"@pluv/types": major
"@pluv/platform-node": major
---

Drop `@pluv/pubsub-redis` and `io.procedure.sync()`. A live room is not split across Node processes; occupancy, presence, and `listUsers` stay local. `@pluv/persistence-redis` still persists CRDT storage, and `platformNode({ persistence })` no longer takes `pubSub`.

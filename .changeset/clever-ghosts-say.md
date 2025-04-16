---
"@pluv/io": minor
---

**BREAKING** Updated the way `user` is stored and read from the websocket, so now `user` is persisted in-memory rather than from persistent storage (improves performance and lowers cost in some cases). This change primarily affects pluv platforms, which are intended for internal use only, and therefore should not be mostly non-breaking.

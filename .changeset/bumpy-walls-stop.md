---
"@pluv/io": minor
---

**BREAKING** The `user` that is provided to `PluvServer.createToken` is now limited to be at most 512 bytes. If the `user` is any larger, `PluvServer.createToken` will now throw an error.

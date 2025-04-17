---
"@pluv/io": minor
---

**BREAKING** User's presence is now limited to be at most 512 bytes. If the presence is any larger, the `PluvServer` will now throw an error.

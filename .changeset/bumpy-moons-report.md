---
"@pluv/io": patch
---

Fix in-memory persistence reporting the wrong user count for a room.

`getUsersSize` now counts connections in that room instead of how many rooms exist in memory, matching Redis and other persistence backends.

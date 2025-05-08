---
"@pluv/client": patch
"@pluv/io": patch
---

Fixed potential storage race condition that occurred when 2 users joined a room near simultaneously, where storage data would get mismatched from the server.

---
"@pluv/io": patch
---

Fix JWT `maxAge` so it is treated as milliseconds (default 60s), and treat invalid/expired tokens as unauthorized instead of throwing during register.

Room registration also waits for room initialization to finish before accepting the connection, so clients are not registered against a room that is still loading storage.

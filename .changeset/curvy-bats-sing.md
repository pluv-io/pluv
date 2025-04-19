---
"@pluv/client": patch
---

When presence is received for a user that is not currently being tracked, `PluvRoom` now automatically updates `others` to include the connection of the received presence.

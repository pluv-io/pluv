---
"@pluv/client": patch
---

Update the user's presence locally only via `PluvRoom.updateMyPresence` (i.e. do not update the user's own presence from WebSocket messages) to avoid update delays. This should fix some cases of "jitter" depending on network latecy.

---
"@pluv/io": patch
---

Prevent garbage collection from evicting healthy hibernated WebSockets.

`IORoom` now uses the platform's latest ping timestamp when finding timed-out connections. This keeps Cloudflare WebSockets alive when their auto-response timestamp is newer than the serialized ping stored before hibernation.

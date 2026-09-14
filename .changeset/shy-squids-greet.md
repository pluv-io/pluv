---
"@pluv/io": patch
---

Reject `$` in user router event names consistently, and throw when merging routers that define the same event twice.

Previously `$` was only blocked via `io.router()`, so a direct `PluvRouter` could still register reserved-looking names, and duplicate procedure names on merge silently overwrote each other.

---
"@pluv/io": patch
---

Fix socket error-then-close running disconnect twice.

A connection that errors and then closes no longer broadcasts a second `$exit` or fires `onUserDisconnected` again.

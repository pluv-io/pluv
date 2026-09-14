---
"@pluv/io": patch
---

Fail fast on invalid or conflicting custom event names.

Event names that use `$` (reserved for built-in protocol events) are now rejected wherever you define a router, not only through `io.router()`. Merging two routers that both define the same event also throws instead of keeping whichever was registered last.

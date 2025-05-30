---
"@pluv/client": patch
---

Fixed a case where an empty storage store (e.g. @pluv/addon-indexeddb) would result in an empty initial storage, even when an initial storage was defined.

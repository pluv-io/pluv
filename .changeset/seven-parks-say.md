---
"@pluv/types": patch
---

Align built-in client event payload types with what the server already accepts.

`$initializeSession` / `$updatePresence` presence and `$updateStorage` update may be `null`, matching runtime handling in the base protocol router.

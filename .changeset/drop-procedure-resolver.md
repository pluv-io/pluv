---
"@pluv/types": patch
"@pluv/io": patch
"@pluv/client": patch
---

Remove the unused combined `config.resolver` from procedures.

Event handlers already run via `broadcast`, `self`, and `sync` individually; the merged resolver was never called at runtime.

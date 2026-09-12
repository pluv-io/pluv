---
"@pluv/io": patch
---

Keep room broadcasts reliable when one socket fails to send.

A single dead or erroring connection no longer risks dropping the rest of the fan-out or leaving an unhandled rejection while delivering events to everyone else.

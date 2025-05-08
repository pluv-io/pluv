---
"@pluv/client": patch
"@pluv/io": patch
---

Fixed storage race condition that occurred when 2 users joined a room near simultaneously that would cause users to have mismatched storage states from the server (and thereby preventing updates from properly registering) until the user reconnected.


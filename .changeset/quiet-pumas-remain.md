---
"@pluv/io": patch
---

Fix initial presence not being saved on the server.

Late joiners could see other users with empty/default presence, and later presence patches could drop fields that were only set when the session started.

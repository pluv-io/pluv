---
"@pluv/io": patch
---

Surface procedure and size-limit failures to clients as `$error`.

If a custom event handler threw, or presence/storage exceeded its size limit, the server used to fail silently from the client's point of view. Those errors now arrive on the same `$error` path already used for invalid input.

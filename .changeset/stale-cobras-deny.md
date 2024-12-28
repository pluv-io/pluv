---
"@pluv/platform-cloudflare": minor
"@pluv/platform-node": minor
"@pluv/io": minor
---

Updated `@pluv/io` to have a `handleMode` internally that determines if connections are handled by the `PluvServer` or by the platform itself (i.e. outside of the `PluvServer`). The internals of `@pluv/platform-node` and `@pluv/platform-cloudflare` have been updated with the required changes for this.

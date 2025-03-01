---
"@pluv/platform-cloudflare": patch
"@pluv/platform-node": patch
"@pluv/platform-pluv": patch
"@pluv/io": patch
---

Improved type inference when calling `PluvIO.server` to not include options that are always undefined (i.e. are not allowed by the specified platform).

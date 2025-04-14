---
"@pluv/platform-cloudflare": minor
---

**BREAKING** The `DurableObject` from `createPluvHandler` now properly extends `DuableObject` from `cloudflare:workers`. `@pluv/platform-pluv` is also now only ESM. This may break some Cloudflare Workers if on an older compatibility date.

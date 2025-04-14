---
"@pluv/platform-cloudflare": minor
---

**BREAKING** The `DurableObject` from `createPluvHandler` now properly extends `DuableObject` from `cloudflare:workers`. This may break some Cloudflare Workers if on an older compatibility date.

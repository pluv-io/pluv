---
"@pluv/platform-pluv": patch
---

Fixed the context in `platformPluv` being declared immediately, instead of when the event listeners ran (causing errors in Cloudflare Workers).

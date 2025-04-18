---
"@pluv/platform-cloudflare": patch
---

Update `createPluvHandler` to automatically garbage collect the dead websockets in the `IORoom` every 60 seconds.

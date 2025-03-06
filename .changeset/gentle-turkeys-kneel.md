---
"@pluv/platform-cloudflare": patch
"@pluv/io": patch
---

Fixed an issue where hibernated Cloudflare Worker websockets were not updating their last ping timer and causing them to be disconnected after some time.

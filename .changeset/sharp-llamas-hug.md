---
"@pluv/platform-cloudflare": minor
"@pluv/io": minor
---

* Fix `@pluv/platform-cloudflare` causing frequent disconnects due to incorrect heartbeat handling.
* Updated default `mode` of `@pluv/platform-cloudflare` back to `"detached"` (i.e. use Cloudflare Worker Hibernation API by default).

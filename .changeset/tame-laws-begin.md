---
"@pluv/io": patch
"@pluv/platform-cloudflare": patch
"@pluv/platform-node": patch
---

Moved `sessionId` from being derived in `IORoom` to being derived as a getter in `AbstractWebsocket`.

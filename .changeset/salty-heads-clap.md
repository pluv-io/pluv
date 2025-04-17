---
"@pluv/platform-node": patch
---

Fixed the return type of `createWsServer` from `createPluvHandler` to be `ws.WebSocketServer` instead of `ws.Server`.

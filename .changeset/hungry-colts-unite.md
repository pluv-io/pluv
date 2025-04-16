---
"@pluv/client": patch
---

`PluvRoom` attempts to reconnect immediately after receiving a `close` event, instead of waiting for the reconnect timer. After failing the initial reconnect will the reconnects poll on the timer.

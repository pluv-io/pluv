---
"@pluv/client": patch
---

Fixed "others" state in the PluvClient not getting cleared when the user's websocket connection is closed, creating "ghost users" during some reconnects.

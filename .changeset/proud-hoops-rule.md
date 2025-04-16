---
"@pluv/io": patch
---

Update websocket session connection ids to be deterministic based on the user's id if authorization is configured (i.e. connection id will now just be the user's id with a prefix).

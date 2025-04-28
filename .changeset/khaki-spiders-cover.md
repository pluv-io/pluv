---
"@pluv/persistence-cloudflare-transactional-storage": minor
"@pluv/persistence-redis": minor
---

**BREAKING** `Persistence.getUsers` now returns a map of connection id strings to user JSON objects instead of an array of user JSON objects. This change is intended to be internal only and generally non-breaking.

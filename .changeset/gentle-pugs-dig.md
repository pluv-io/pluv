---
"@pluv/persistence-cloudflare-transactional-storage": minor
"@pluv/platform-cloudflare": minor
---

**BREAKING** Updated the `PersistenceCloudflareTransactionalStorage` constructor so require a new property `mode` (either `kv` or `sqlite`). `sqlite` makes use of `DurableObject` SQLite storage, and `kv` makes use of their key-value storage.

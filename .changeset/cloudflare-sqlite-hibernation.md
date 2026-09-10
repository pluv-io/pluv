---
"@pluv/persistence-cloudflare-transactional-storage": patch
"@pluv/platform-cloudflare": patch
---

Fix Cloudflare room storage being lost after Durable Object hibernation.

`$updateStorage` was writing to the default in-memory persistence because `CloudflarePlatform.initialize()` reused that adapter instead of Durable Object SQLite. Hibernation dropped the in-memory map, so a later reload restored the last `onStorageDestroyed` snapshot.

- `CloudflarePlatform.initialize()` now attaches `PersistenceCloudflareTransactionalStorage` (sqlite) unless a custom persistence adapter was provided.
- `PersistenceCloudflareTransactionalStorage.initialize()` now copies Durable Object state onto the returned instance, so reads and writes actually hit SQLite instead of no-opping.

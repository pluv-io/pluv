---
"@pluv/crdt-yjs": patch
"@pluv/io": patch
"@pluv/persistence-cloudflare-transactional-storage": patch
---

Avoid stale Yjs docs and racing storage writes.

- `PluvYjsProvider.doc` now reads the room's current doc instead of snapshotting it in the constructor, so the provider stays valid after destroy/re-init.
- `$updateStorage` awaits `setStorageState` before continuing, so concurrent updates cannot persist an older snapshot.
- Cloudflare transactional storage no longer sets `allowConcurrency: true` on storage puts.

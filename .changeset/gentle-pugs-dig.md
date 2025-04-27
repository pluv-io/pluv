---
"@pluv/persistence-cloudflare-transactional-storage": minor
"@pluv/platform-cloudflare": minor
---

**BREAKING** Updated the `PersistenceCloudflareTransactionalStorage` constructor so require a new property `mode` (either `kv` or `sqlite`). `sqlite` makes use of `DurableObject` SQLite storage, and `kv` makes use of their key-value storage. `platformCloudflare` now sets the underlying `PersistenceCloudflareTransactionalStorage` to use the `sqlite` mode by default (was previously using `kv`). For more information on the differences, please refer to [Cloudflare's documentation](https://developers.cloudflare.com/durable-objects/api/storage-api/#sql-api).

To continue using the `kv` mode, you will need to install `@pluv/persistence-cloudflare-transactional-storage` and provide it manually to `platformCloudflare` with your desired mode.

```ts
platformCloudflare({
    // ...
    persistence: new PersistenceCloudflareTransactionalStorage({ mode: "kv" }),
    // ...
});
```

---
"@pluv/platform-cloudflare": minor
"@pluv/persistence-redis": minor
"@pluv/addon-indexeddb": minor
"@pluv/platform-node": minor
"@pluv/io": minor
---

**BREAKING **

Fixed typos `persistance` to `persistence`.

This does mean that all properties referencing `persistance` will need to be fixed. Examples below:

```bash
# Re-install @pluv/persistence-redis
pnpm uninstall @pluv/persistance-redis
pnpm install @pluv/persistence-redis
```

```ts
// Before
createIO({
    platform: platformNode({
        persistance: new PersistanceRedis(/* ... */),
    }),
});

// After
createIO({
    platform: platformNode({
        persistence: new PersistenceRedis(/* ... */),
    }),
});
```

`@pluv/persistance-redis` has been deprecated for `@pluv/persistence-redis`.

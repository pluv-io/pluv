# @pluv/persistence-redis

## 0.25.0

### Minor Changes

- 9db06ba: **BREAKING **

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

### Patch Changes

- Updated dependencies [4e078ca]
- Updated dependencies [f556d30]
- Updated dependencies [9db06ba]
  - @pluv/io@0.25.0
  - @pluv/types@0.25.0

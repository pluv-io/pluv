# @pluv/persistence-redis

## 0.37.1

### Patch Changes

- @pluv/io@0.37.1
- @pluv/types@0.37.1

## 0.37.0

### Patch Changes

- Updated dependencies [9b74abb]
  - @pluv/io@0.37.0
  - @pluv/types@0.37.0

## 0.36.0

### Patch Changes

- @pluv/io@0.36.0
- @pluv/types@0.36.0

## 0.35.4

### Patch Changes

- Updated dependencies [5d3a56f]
  - @pluv/io@0.35.4
  - @pluv/types@0.35.4

## 0.35.3

### Patch Changes

- @pluv/io@0.35.3
- @pluv/types@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [81cb692]
  - @pluv/types@0.35.2
  - @pluv/io@0.35.2

## 0.35.1

### Patch Changes

- @pluv/io@0.35.1
- @pluv/types@0.35.1

## 0.35.0

### Patch Changes

- Updated dependencies [c9073ad]
  - @pluv/io@0.35.0
  - @pluv/types@0.35.0

## 0.34.1

### Patch Changes

- Updated dependencies [d639427]
  - @pluv/io@0.34.1
  - @pluv/types@0.34.1

## 0.34.0

### Patch Changes

- Updated dependencies [0c920ea]
- Updated dependencies [70af3b2]
  - @pluv/io@0.34.0
  - @pluv/types@0.34.0

## 0.33.0

### Patch Changes

- @pluv/io@0.33.0
- @pluv/types@0.33.0

## 0.32.9

### Patch Changes

- @pluv/io@0.32.9
- @pluv/types@0.32.9

## 0.32.8

### Patch Changes

- Updated dependencies [e659f8a]
  - @pluv/io@0.32.8
  - @pluv/types@0.32.8

## 0.32.7

### Patch Changes

- @pluv/io@0.32.7
- @pluv/types@0.32.7

## 0.32.6

### Patch Changes

- Updated dependencies [c0956e7]
  - @pluv/io@0.32.6
  - @pluv/types@0.32.6

## 0.32.5

### Patch Changes

- @pluv/io@0.32.5
- @pluv/types@0.32.5

## 0.32.4

### Patch Changes

- @pluv/io@0.32.4
- @pluv/types@0.32.4

## 0.32.3

### Patch Changes

- Updated dependencies [bb21274]
  - @pluv/io@0.32.3
  - @pluv/types@0.32.3

## 0.32.2

### Patch Changes

- Updated dependencies [890d45b]
  - @pluv/io@0.32.2
  - @pluv/types@0.32.2

## 0.32.1

### Patch Changes

- @pluv/io@0.32.1
- @pluv/types@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [cde5305]
  - @pluv/io@0.32.0
  - @pluv/types@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [b3c31d7]
  - @pluv/io@0.31.0
  - @pluv/types@0.31.0

## 0.30.2

### Patch Changes

- @pluv/io@0.30.2
- @pluv/types@0.30.2

## 0.30.1

### Patch Changes

- Updated dependencies [b9c3633]
  - @pluv/io@0.30.1
  - @pluv/types@0.30.1

## 0.30.0

### Patch Changes

- Updated dependencies [7246a9e]
  - @pluv/io@0.30.0
  - @pluv/types@0.30.0

## 0.29.0

### Patch Changes

- @pluv/io@0.29.0
- @pluv/types@0.29.0

## 0.28.0

### Patch Changes

- @pluv/io@0.28.0
- @pluv/types@0.28.0

## 0.27.0

### Patch Changes

- Updated dependencies [19ed36c]
- Updated dependencies [e309b0b]
  - @pluv/io@0.27.0
  - @pluv/types@0.27.0

## 0.26.0

### Patch Changes

- @pluv/io@0.26.0
- @pluv/types@0.26.0

## 0.25.4

### Patch Changes

- Updated dependencies [7a9080c]
  - @pluv/io@0.25.4
  - @pluv/types@0.25.4

## 0.25.3

### Patch Changes

- Updated dependencies [50d9b96]
  - @pluv/io@0.25.3
  - @pluv/types@0.25.3

## 0.25.2

### Patch Changes

- Updated dependencies [60a0bf1]
  - @pluv/io@0.25.2
  - @pluv/types@0.25.2

## 0.25.1

### Patch Changes

- Updated dependencies [3925f7c]
  - @pluv/io@0.25.1
  - @pluv/types@0.25.1

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

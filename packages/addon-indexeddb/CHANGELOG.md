# @pluv/addon-indexeddb

## 0.19.0

### Patch Changes

- Updated dependencies [137444b]
- Updated dependencies [f5e4370]
  - @pluv/client@0.19.0
  - @pluv/crdt@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies [06c67be]
- Updated dependencies [99b5ca9]
- Updated dependencies [df1342c]
  - @pluv/client@0.18.0
  - @pluv/crdt@0.18.0

## 0.17.3

### Patch Changes

- @pluv/client@0.17.3
- @pluv/crdt@0.17.3

## 0.17.2

### Patch Changes

- @pluv/client@0.17.2
- @pluv/crdt@0.17.2

## 0.17.1

### Patch Changes

- @pluv/client@0.17.1
- @pluv/crdt@0.17.1

## 0.17.0

### Patch Changes

- @pluv/client@0.17.0
- @pluv/crdt@0.17.0

## 0.16.3

### Patch Changes

- @pluv/client@0.16.3
- @pluv/crdt@0.16.3

## 0.16.2

### Patch Changes

- @pluv/client@0.16.2
- @pluv/crdt@0.16.2

## 0.16.1

### Patch Changes

- @pluv/client@0.16.1
- @pluv/crdt@0.16.1

## 0.16.0

### Patch Changes

- Updated dependencies [4280220]
  - @pluv/client@0.16.0
  - @pluv/crdt@0.16.0

## 0.15.0

### Patch Changes

- @pluv/client@0.15.0

## 0.14.1

### Patch Changes

- @pluv/client@0.14.1

## 0.14.0

### Patch Changes

- @pluv/client@0.14.0

## 0.13.0

### Patch Changes

- Updated dependencies [1126215]
  - @pluv/client@0.13.0

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies
- Updated dependencies [da9f600]
  - @pluv/client@0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

### Patch Changes

- Updated dependencies [cae08aa]
  - @pluv/client@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [436040b]
  - @pluv/client@0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
- Updated dependencies [74b3061]
  - @pluv/client@0.11.1

## 0.11.0

### Patch Changes

- @pluv/client@0.11.0

## 0.10.3

### Patch Changes

- @pluv/client@0.10.3

## 0.10.2

### Patch Changes

- @pluv/client@0.10.2

## 0.10.1

### Patch Changes

- Updated dependencies [885835d]
  - @pluv/client@0.10.1

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

### Patch Changes

- Updated dependencies [f43f1cc]
  - @pluv/client@0.10.0

## 0.1.2

### Patch Changes

- Updated dependencies [f4317ba]
  - @pluv/client@0.9.2

## 0.1.1

### Patch Changes

- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/client@0.9.1

## 0.1.0

### Minor Changes

- 829d31b: Added support for defining persistant frontend storage for rooms via a new `addons` option on rooms.

  This also introduces the first new addon `@pluv/addon-indexeddb`, which is more-or-less the equivalent to `y-indexeddb` which you can install like so:

  ```
  npm install @pluv/addon-indexeddb
  ```

  To use this new addon, simply pass it to options when creating a room:

  ```ts
  import { addonIndexedDB } from "@pluv/addon-indexeddb";
  import { createClient } from "@pluv/client";

  const client = createClient({
    // ...
  });

  const room = client.createRoom("my-new-room", {
    addons: [
      // Define your addons in an array like so
      addonIndexedDB(),
    ],
  });
  ```

  Or when using `@pluv/react`:

  ```ts
  const PluvRoom = createRoomBundle({
    // ...
    addons: [
      // Define your addons in an array like so
      addonIndexedDB(),
    ],
  });
  ```

### Patch Changes

- 8d11672: bumped dependencies to latest
- Updated dependencies [8d11672]
- Updated dependencies [829d31b]
  - @pluv/client@0.9.0

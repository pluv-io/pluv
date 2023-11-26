# @pluv/addon-indexeddb

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies
- 8fdc159: Upgraded dependencies.
- Updated dependencies [259a7da]
- Updated dependencies [8fdc159]
  - @pluv/client@0.12.2

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

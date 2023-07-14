# @pluv/crdt-yjs

## 0.4.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/types@0.2.2

## 0.4.0

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
  - @pluv/types@0.2.1

## 0.3.8

### Patch Changes

- b85a232: bumped dependencies
  - @pluv/types@0.2.0

## 0.3.7

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
  - @pluv/types@0.2.0

## 0.3.6

### Patch Changes

- 78fd644: updated readmes with links to the documentation website

## 0.3.5

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/types@0.1.6

## 0.3.4

### Patch Changes

- 9ae251d: bumped dependencies

## 0.3.3

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/types@0.1.5

## 0.3.2

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
  - @pluv/types@0.1.4

## 0.3.1

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
  - @pluv/types@0.1.3

## 0.3.0

### Minor Changes

- 327a6ef: renamed y.unstable\_\_object to y.object

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [8e97fb2]
  - @pluv/types@0.1.3

## 0.2.0

### Minor Changes

- 6858682: Added support for yjs xml types including XmlElement, XmlFragment and XmlText

### Patch Changes

- @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- b45d642: Fixed links on README

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies
- Updated dependencies [24016e6]
  - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
  - @pluv/types@0.1.0

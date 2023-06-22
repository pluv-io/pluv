# pluv

## 0.6.0

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

## 0.5.0

### Minor Changes

- a3e8f15: Updated cli to use latest pluv packages.

## 0.4.6

### Patch Changes

- a5f7176: fix(deps): update dependency @pluv/platform-node to ^0.2.0

## 0.4.5

### Patch Changes

- f2c3707: fix(deps): update dependency @pluv/io to ^0.4.0
- b85a232: bumped dependencies
  - @pluv/types@0.2.0

## 0.4.4

### Patch Changes

- ef162ad: chore(deps): update nextjs monorepo to v13.3.1
- 41943cf: bumped dependencies
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
  - @pluv/types@0.2.0

## 0.4.3

### Patch Changes

- 78fd644: updated readmes with links to the documentation website

## 0.4.2

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/types@0.1.6

## 0.4.1

### Patch Changes

- 9fd8779: chore(deps): update nextjs monorepo to v13.3.0
- 77069a1: replaced chalk for kleur
  - @pluv/types@0.1.5

## 0.4.0

### Minor Changes

- a0160cf: bumped @pluv/io

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/types@0.1.5

## 0.3.4

### Patch Changes

- 57ae13f: bumped dependencies
  - @pluv/types@0.1.4

## 0.3.3

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
  - @pluv/types@0.1.4

## 0.3.2

### Patch Changes

- 9c30e96: bumped dependencies
- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
  - @pluv/types@0.1.3

## 0.3.1

### Patch Changes

- fa2bcf2: fix(deps): update dependency @pluv/react to ^0.5.0
- 797ae60: chore(deps): update nextjs monorepo to v13.2.4

## 0.3.0

### Minor Changes

- 10e715d: fix(deps): update dependency @pluv/react to ^0.4.0
- 327a6ef: renamed y.unstable\_\_object to y.object
- 0f35eae: fix(deps): update dependency @pluv/react to ^0.3.0

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 1a15739: chore(deps): update nextjs monorepo to v13.2.1
- 106ee81: chore(deps): update nextjs monorepo to v13.2.3
- e7360b6: chore(deps): update nextjs monorepo to v13.2.2
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [8e97fb2]
  - @pluv/types@0.1.3

## 0.2.3

### Patch Changes

- 6d2903f: chore(deps): update nextjs monorepo to v13.1.4
- 629b1f1: chore(deps): update nextjs monorepo to v13.1.5
- 1aa2216: fix(deps): update dependency @pluv/react to ^0.2.0
- 7280a83: chore(deps): update nextjs monorepo to v13.1.3

## 0.2.2

### Patch Changes

- 6d2903f: chore(deps): update nextjs monorepo to v13.1.4
- 629b1f1: chore(deps): update nextjs monorepo to v13.1.5
- 1aa2216: fix(deps): update dependency @pluv/react to ^0.2.0
- 7280a83: chore(deps): update nextjs monorepo to v13.1.3

## 0.2.1

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/types@0.1.2

## 0.2.0

### Minor Changes

- 87bd206: updated pluv dependencies in template

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

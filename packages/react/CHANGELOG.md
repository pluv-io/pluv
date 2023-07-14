# @pluv/react

## 0.6.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/client@0.9.1
  - @pluv/types@0.2.2

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
- Updated dependencies [829d31b]
  - @pluv/client@0.9.0
  - @pluv/types@0.2.1

## 0.5.11

### Patch Changes

- 2c9c5c3: changed my-presence to be non-nullable
- Updated dependencies [2c9c5c3]
  - @pluv/client@0.8.1

## 0.5.10

### Patch Changes

- 5bbfb98: fix not properly handling unauthorized checks
- b85a232: bumped dependencies
- Updated dependencies [5bbfb98]
- Updated dependencies [b85a232]
- Updated dependencies [fde89cf]
  - @pluv/client@0.8.0
  - @pluv/types@0.2.0

## 0.5.9

### Patch Changes

- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [bb2886b]
- Updated dependencies [3518a83]
  - @pluv/client@0.7.0
  - @pluv/types@0.2.0

## 0.5.8

### Patch Changes

- 7ad4967: fixed user's presence not updating locally while offline
- Updated dependencies [7ad4967]
- Updated dependencies [4535687]
  - @pluv/client@0.6.5
  - @pluv/types@0.1.6

## 0.5.7

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/client@0.6.4

## 0.5.6

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/client@0.6.3
  - @pluv/types@0.1.6

## 0.5.5

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
  - @pluv/client@0.6.2

## 0.5.4

### Patch Changes

- 19433af: updated MockedRoomProvider events to allow partial events
- b80c555: updated react hooks to not re-render if state is deeply equal by default
- 74870ee: bumped dependencies
- Updated dependencies [19433af]
- Updated dependencies [74870ee]
  - @pluv/client@0.6.1
  - @pluv/types@0.1.5

## 0.5.3

### Patch Changes

- 57ae13f: bumped dependencies
  - @pluv/client@0.6.0
  - @pluv/types@0.1.4

## 0.5.2

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [e1308e3]
- Updated dependencies [9516a4e]
- Updated dependencies [e1308e3]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
- Updated dependencies [9d1829c]
  - @pluv/client@0.6.0
  - @pluv/types@0.1.4

## 0.5.1

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/client@0.5.1
  - @pluv/types@0.1.3

## 0.5.0

### Minor Changes

- 327a6ef: renamed y.unstable\_\_object to y.object

### Patch Changes

- 78a6119: Fixed MockedRoom not sending storage updates
- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- b4e34bc: chore(deps): update dependency @types/react to v18.0.28
- ec50c73: fix: fixed mocked room not working
- 8e97fb2: Updated dependencies
- Updated dependencies [78a6119]
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
  - @pluv/client@0.5.0
  - @pluv/types@0.1.3

## 0.4.0

### Minor Changes

- 043c915: Added MockedDataProvider from createRoomBundle

### Patch Changes

- 93f8c54: chore(deps): update dependency @types/react to v18.0.27
- Updated dependencies [595e66f]
  - @pluv/client@0.4.0

## 0.3.0

### Minor Changes

- 043c915: Added MockedDataProvider from createRoomBundle

### Patch Changes

- 93f8c54: chore(deps): update dependency @types/react to v18.0.27
- Updated dependencies [595e66f]
  - @pluv/client@0.3.0

## 0.2.0

### Minor Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api

### Patch Changes

- Updated dependencies [95b5ef8]
  - @pluv/client@0.2.0
  - @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/client@0.1.3
  - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- @pluv/client@0.1.2

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies
- Updated dependencies [23a7382]
- Updated dependencies [24016e6]
  - @pluv/client@0.1.1
  - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
  - @pluv/client@0.1.0
  - @pluv/types@0.1.0

# @pluv/client

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
- Updated dependencies [74b3061]
  - @pluv/crdt-yjs@0.11.1
  - @pluv/types@0.11.1

## 0.11.0

### Patch Changes

- @pluv/crdt-yjs@0.11.0
- @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- @pluv/crdt-yjs@0.10.3
- @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- @pluv/crdt-yjs@0.10.2
- @pluv/types@0.10.2

## 0.10.1

### Patch Changes

- 885835d: remove unnecessary dependency
- Updated dependencies [885835d]
  - @pluv/crdt-yjs@0.10.1
  - @pluv/types@0.10.1

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

### Patch Changes

- Updated dependencies [f43f1cc]
  - @pluv/crdt-yjs@0.10.0
  - @pluv/types@0.10.0

## 0.9.2

### Patch Changes

- f4317ba: \* Renamed type `unstable_YObjectValue` to `YObjectValue`;

  - Renamed type `unstable_YObject` to `YObject`.
  - Re-exported `xmlElement`, `xmlFragment` and `xmlText` from `@pluv/client`.

    ```ts
    import { y } from "@pluv/client";
    // or
    import { y } from "@pluv/react";

    y.xmlElement("MyElement", {});
    y.xmlFragment({});
    y.xmlText("hello world");
    ```

- Updated dependencies [f4317ba]
  - @pluv/crdt-yjs@0.4.2

## 0.9.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/crdt-yjs@0.4.1
  - @pluv/types@0.2.2

## 0.9.0

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
  - @pluv/crdt-yjs@0.4.0
  - @pluv/types@0.2.1

## 0.8.1

### Patch Changes

- 2c9c5c3: changed my-presence to be non-nullable

## 0.8.0

### Minor Changes

- fde89cf: added defaults to the client to align it with createPluvClient by default

### Patch Changes

- 5bbfb98: fix not properly handling unauthorized checks
- b85a232: bumped dependencies
- Updated dependencies [b85a232]
  - @pluv/crdt-yjs@0.3.8
  - @pluv/types@0.2.0

## 0.7.0

### Minor Changes

- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room
- bb2886b: fixed not reconnecting during heartbeat
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
  - @pluv/crdt-yjs@0.3.7
  - @pluv/types@0.2.0

## 0.6.5

### Patch Changes

- 7ad4967: fixed user's presence not updating locally while offline
- 4535687: fix local yjs doc not updating while disconnected
  - @pluv/crdt-yjs@0.3.6
  - @pluv/types@0.1.6

## 0.6.4

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/crdt-yjs@0.3.6

## 0.6.3

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/crdt-yjs@0.3.5
  - @pluv/types@0.1.6

## 0.6.2

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
  - @pluv/crdt-yjs@0.3.4

## 0.6.1

### Patch Changes

- 19433af: updated MockedRoomProvider events to allow partial events
- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/crdt-yjs@0.3.3
  - @pluv/types@0.1.5

## 0.6.0

### Minor Changes

- e1308e3: changed `PluvClient.createRoom` to have optional options.
- e1308e3: changed `PluvClient.enter` to return the `PluvRoom` that was entered.

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies
- 9d1829c: chore: bumped dependencies
- Updated dependencies [9516a4e]
- Updated dependencies [7b6da1c]
- Updated dependencies [e9c1514]
- Updated dependencies [9d1829c]
  - @pluv/crdt-yjs@0.3.2
  - @pluv/types@0.1.4

## 0.5.1

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/crdt-yjs@0.3.1
  - @pluv/types@0.1.3

## 0.5.0

### Minor Changes

- 327a6ef: renamed y.unstable\_\_object to y.object

### Patch Changes

- 78a6119: Fixed MockedRoom not sending storage updates
- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
  - @pluv/crdt-yjs@0.3.0
  - @pluv/types@0.1.3

## 0.4.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.3.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.2.0

### Minor Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api

### Patch Changes

- Updated dependencies [6858682]
  - @pluv/crdt-yjs@0.2.0
  - @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/crdt-yjs@0.1.3
  - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies [b45d642]
  - @pluv/crdt-yjs@0.1.2

## 0.1.1

### Patch Changes

- 23a7382: Omitted unused `encodedState` param from PluvRoom.
- 24016e6: Updated dependencies
- Updated dependencies [24016e6]
  - @pluv/crdt-yjs@0.1.1
  - @pluv/types@0.1.1

## 0.1.0

### Minor Changes

- a22f525: Added documentation

### Patch Changes

- Updated dependencies [a22f525]
  - @pluv/crdt-yjs@0.1.0
  - @pluv/types@0.1.0

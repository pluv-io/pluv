# @pluv/react

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies
- Updated dependencies [da9f600]
  - @pluv/client@0.12.3
  - @pluv/types@0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

### Patch Changes

- cae08aa: Updated storage from `getStorage` to never return null
- Updated dependencies [cae08aa]
  - @pluv/client@0.12.1
  - @pluv/types@0.12.1

## 0.12.0

### Minor Changes

- 436040b: Added ability to undo and redo changes to storage.

  ## @pluv/crdt-yjs

  `@pluv/crdt-yjs` now exposes 5 new methods: `canRedo`, `canUndo`, `redo`, `undo` and `trackOrigins`.

  Refer to the code-example below to better understand how to undo and redo with your doc.

  ```ts
  // Example
  import { array, doc } from "@pluv/crdt-yjs";

  // Create your doc with your shared-types
  const myDoc = doc({
    messages: array<string>([]),
  });

  /**
   * @description Track origins to enable undos and redos for your document.
   * trackOrigins must be called before any storage mutations, to enable those
   * mutations to be undone/redone.
   */
  myDoc.trackOrigins({
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
  });

  /**
   * @description Check whether calling undo will mutate storage
   * @returns boolean
   */
  myDoc.canUndo();
  /**
   * @description Check whether calling redo will mutate storage
   * @returns boolean
   */
  myDoc.canRedo();

  // Perform a storage mutation within a transaction so that it can be affected
  // by undo/redo operations.
  myDoc.transact(() => {
    myDoc.get("messages").push(["hello world!"]);
  }, "user-123");

  /**
   * @description Undoes the last valid mutation to storage
   */
  myDoc.undo();

  /**
   * @description Re-applies the last undone mutation to storage
   */
  myDoc.redo();
  ```

  ## @pluv/client

  `@pluv/client`'s `PluvRoom` and `MockedRoom` now exposes 5 new methods: `canRedo`, `canUndo`, `redo`, `undo` and `transact`.

  Refer to the code-example below to better understand how to undo and redo with your `PluvRoom`.

  ```ts
  import { createClient, y } from "@pluv/client";

  const client = createClient({});

  /**
   * @description When a room is created, undo/redo will automatically
   * be configured to filter for changes made by the connected user
   * (so that users only undo/redo their changes).
   */
  const room = client.createRoom("my-room", {
    initialStorage: () => ({
      messages: y.array<string>([]),
    }),
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * When omitted, the user's connection id will be tracked. When provided,
     * specifies additional tracked origins besides the user's connection id.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
  });

  /**
   * @description Check whether calling undo will mutate storage
   * @returns boolean
   */
  room.canUndo();
  /**
   * @description Check whether calling redo will mutate storage
   * @returns boolean
   */
  room.canRedo();

  /**
   * @description Calling transact will enable a storage mutation to be undone/redone.
   * When called without an origin, the origin will default to the user's connection
   * id.
   *
   * You can specify a 2nd parameter to transact with a different transaction origin.
   */
  room.transact(() => {
    room.get("messages").push(["hello world!"]);
  });

  // This will also be undoable because `"user-123"` is a tracked origin.
  room.transact(() => {
    room.get("messages").push(["hello world!"]);
  }, "user-123");

  /**
   * @description Undoes the last valid mutation to storage
   */
  room.undo();

  /**
   * @description Re-applies the last undone mutation to storage
   */
  room.redo();
  ```

  ## @pluv/react

  `@pluv/react`'s `createRoomBundle` now exposes 5 new react hooks: `usePluvCanRedo`, `usePluvCanUndo`, `usePluvRedo`, `usePluvUndo` and `usePluvTransact`.

  Refer to the code-example below to better understand how to undo and redo with your `createRoomBundle`.

  ```tsx
  import { createBundle, createClient, y } from "@pluv/react";
  import { type io } from "./io";

  const client = createClient<typeof io>();

  const { createRoomBundle } = createBundle(client);

  const {
    usePluvCanRedo,
    usePluvCanUndo,
    usePluvRedo,
    usePluvStorage,
    usePluvTransact,
    usePluvUndo,
  } = createRoomBundle({
    initialStorage: () => ({
      messages: y.array<string>([]),
    }),
    /**
     * @description This is the same `captureTimeout` option from yjs's UndoManager.
     * This specifies a number in ms, during which edits are merged together to be
     * undone together. Set this to 0, to track each transacted change individually.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default 500
     */
    captureTimeout: 500,
    /**
     * @desription This is the same `trackedOrigins` option from yjs's UndoManager.
     * This specifies transaction origins (strings only) to filter which transactions
     * can be undone.
     * When omitted, the user's connection id will be tracked. When provided,
     * specifies additional tracked origins besides the user's connection id.
     * @see (@link https://docs.yjs.dev/api/undo-manager)
     * @default undefined
     */
    trackedOrigins: ["user-123"],
  });

  /**
   * @description Check whether calling undo will mutate storage
   */
  const canUndo: boolean = usePluvCanUndo();
  /**
   * @description Check whether calling redo will mutate storage
   */
  const canRedo: boolean = usePluvCanRedo();

  const [messages, sharedType] = usePluvStorage("messages");

  /**
   * @description Calling transact will enable a storage mutation to be undone/redone.
   * When called without an origin, the origin will default to the user's connection
   * id.
   *
   * You can specify a 2nd parameter to transact with a different transaction origin.
   */
  const transact = usePluvTransact();

  transact(() => {
    sharedType.push(["hello world!"]);
  });

  // This will also be undoable because `"user-123"` is a tracked origin.
  transact(() => {
    sharedType.push(["hello world!"]);
  }, "user-123");

  /**
   * @description Undoes the last valid mutation to storage
   */
  const undo = usePluvUndo();

  undo();

  /**
   * @description Re-applies the last undone mutation to storage
   */
  const redo = usePluvRedo();

  redo();
  ```

### Patch Changes

- Updated dependencies [436040b]
  - @pluv/client@0.12.0
  - @pluv/types@0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
- Updated dependencies [74b3061]
  - @pluv/client@0.11.1
  - @pluv/types@0.11.1

## 0.11.0

### Patch Changes

- @pluv/client@0.11.0
- @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- @pluv/client@0.10.3
- @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- @pluv/client@0.10.2
- @pluv/types@0.10.2

## 0.10.1

### Patch Changes

- 885835d: remove unnecessary dependency
- Updated dependencies [885835d]
  - @pluv/client@0.10.1
  - @pluv/types@0.10.1

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

### Patch Changes

- Updated dependencies [f43f1cc]
  - @pluv/client@0.10.0
  - @pluv/types@0.10.0

## 0.6.2

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
  - @pluv/client@0.9.2

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

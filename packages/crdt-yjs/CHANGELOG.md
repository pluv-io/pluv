# @pluv/crdt-yjs

## 0.36.0

### Patch Changes

- @pluv/crdt@0.36.0
- @pluv/types@0.36.0

## 0.35.4

### Patch Changes

- @pluv/crdt@0.35.4
- @pluv/types@0.35.4

## 0.35.3

### Patch Changes

- @pluv/crdt@0.35.3
- @pluv/types@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [81cb692]
  - @pluv/types@0.35.2
  - @pluv/crdt@0.35.2

## 0.35.1

### Patch Changes

- 820898c: Increase undo/redo merge interval from 0s to 1s.
  - @pluv/crdt@0.35.1
  - @pluv/types@0.35.1

## 0.35.0

### Patch Changes

- @pluv/crdt@0.35.0
- @pluv/types@0.35.0

## 0.34.1

### Patch Changes

- @pluv/crdt@0.34.1
- @pluv/types@0.34.1

## 0.34.0

### Patch Changes

- @pluv/crdt@0.34.0
- @pluv/types@0.34.0

## 0.33.0

### Patch Changes

- @pluv/crdt@0.33.0
- @pluv/types@0.33.0

## 0.32.9

### Patch Changes

- @pluv/crdt@0.32.9
- @pluv/types@0.32.9

## 0.32.8

### Patch Changes

- @pluv/crdt@0.32.8
- @pluv/types@0.32.8

## 0.32.7

### Patch Changes

- @pluv/crdt@0.32.7
- @pluv/types@0.32.7

## 0.32.6

### Patch Changes

- @pluv/crdt@0.32.6
- @pluv/types@0.32.6

## 0.32.5

### Patch Changes

- @pluv/crdt@0.32.5
- @pluv/types@0.32.5

## 0.32.4

### Patch Changes

- @pluv/crdt@0.32.4
- @pluv/types@0.32.4

## 0.32.3

### Patch Changes

- @pluv/crdt@0.32.3
- @pluv/types@0.32.3

## 0.32.2

### Patch Changes

- @pluv/crdt@0.32.2
- @pluv/types@0.32.2

## 0.32.1

### Patch Changes

- @pluv/crdt@0.32.1
- @pluv/types@0.32.1

## 0.32.0

### Patch Changes

- @pluv/crdt@0.32.0
- @pluv/types@0.32.0

## 0.31.0

### Patch Changes

- @pluv/crdt@0.31.0
- @pluv/types@0.31.0

## 0.30.2

### Patch Changes

- @pluv/crdt@0.30.2
- @pluv/types@0.30.2

## 0.30.1

### Patch Changes

- @pluv/crdt@0.30.1
- @pluv/types@0.30.1

## 0.30.0

### Patch Changes

- 7246a9e: Added `CrdtLibraryType` so that `@pluv/crdt-yjs` and `@pluv/crdt-loro` export a new property `kind` containing an identifier for the crdt.
  - @pluv/crdt@0.30.0
  - @pluv/types@0.30.0

## 0.29.0

### Patch Changes

- @pluv/crdt@0.29.0
- @pluv/types@0.29.0

## 0.28.0

### Patch Changes

- @pluv/crdt@0.28.0
- @pluv/types@0.28.0

## 0.27.0

### Patch Changes

- @pluv/crdt@0.27.0
- @pluv/types@0.27.0

## 0.26.0

### Patch Changes

- @pluv/crdt@0.26.0
- @pluv/types@0.26.0

## 0.25.4

### Patch Changes

- @pluv/crdt@0.25.4
- @pluv/types@0.25.4

## 0.25.3

### Patch Changes

- @pluv/crdt@0.25.3
- @pluv/types@0.25.3

## 0.25.2

### Patch Changes

- @pluv/crdt@0.25.2
- @pluv/types@0.25.2

## 0.25.1

### Patch Changes

- @pluv/crdt@0.25.1
- @pluv/types@0.25.1

## 0.25.0

### Patch Changes

- @pluv/crdt@0.25.0
- @pluv/types@0.25.0

## 0.24.1

### Patch Changes

- @pluv/crdt@0.24.1
- @pluv/types@0.24.1

## 0.24.0

### Patch Changes

- @pluv/crdt@0.24.0
- @pluv/types@0.24.0

## 0.23.0

### Patch Changes

- @pluv/crdt@0.23.0
- @pluv/types@0.23.0

## 0.22.0

### Patch Changes

- @pluv/crdt@0.22.0
- @pluv/types@0.22.0

## 0.21.1

### Patch Changes

- @pluv/crdt@0.21.1
- @pluv/types@0.21.1

## 0.21.0

### Patch Changes

- @pluv/crdt@0.21.0
- @pluv/types@0.21.0

## 0.20.0

### Minor Changes

- 9492085: **BREAKING**: `@pluv/crdt-yjs` and `@pluv/crdt-loro` have been updated so that the utilities to create shared-types/containers no-longer return a wrapper around the underlying shared-types and containers, but rather return the shared-types/containers directly.

  This means that for methods such as `getStorage` from `@pluv/client` and `useStorage` from `@pluv/react`, the shared-types/containers are also returned instead of the wrapper types.

  The motivation for these changes are so that pluv.io is supplementary to `yjs` and `loro-crdt`, instead of having these libraries be an internal implementation of pluv.io.

  ```ts
  // Before

  import { yjs } from "@pluv/crdt-yjs";

  yjs.array([]); // Returns CrdtYjsArray
  yjs.object([]); // Returns CrdtYjsObject

  const room: PluvRoom = /* ... */;

  room.getStorage("messages"); // Returns AbstractCrdtType

  const [, sharedType] = useStorage("messages"); // sharedType is an AbstractCrdtType
  ```

  ```ts
  // Now

  import { yjs } from "@pluv/crdt-yjs";

  yjs.array([]); // Returns yjs.Array
  yjs.object([]); // Returns yjs.Map

  const room: PluvRoom = /* ... */;

  room.getStorage("messages"); // Returns yjs.AbstractType

  const [, sharedType] = useStorage("messages"); // sharedType is a yjs.AbstractType
  ```

  For `@pluv/crdt-loro` specifically, `@pluv/client` relies on [loro events and subscriptions](https://www.loro.dev/docs/tutorial/get_started#event) to detect changes. The `AbstractLoroCrdt` types previously called `Loro.commit` after each change as an abstraction, but now this no-longer happens. To ensure that changes to loro containers are properly handled in `@pluv/react`, make sure to commit your changes whenever possible:

  ```ts
  // Before

  const [data, container] = useStorage("messages");

  // This automatically called Loro.commit under the hood and rerendered the page with updated data.
  container.push(loro.object({ name: "John Doe", age: 35 }));
  ```

  ```ts
  // Now

  const [data, container] = useStorage("messages");

  const doc = useDoc();
  const transact = useTransact();

  // Updates need to be committed back to the doc whenever the changes need to be emitted to other users
  // The returned data also will not update until the changes are commited

  // The two operations below are functionally equivalent
  transact(() => {
    container.push(loro.object({ name: "John Doe", age: 35 }));
  });

  container.push(loro.object({ name: "John Doe", age: 35 }));
  doc.value.commit();
  ```

### Patch Changes

- Updated dependencies [9492085]
  - @pluv/crdt@0.20.0
  - @pluv/types@0.20.0

## 0.19.0

### Patch Changes

- @pluv/crdt@0.19.0
- @pluv/types@0.19.0

## 0.18.0

### Patch Changes

- Updated dependencies [99b5ca9]
  - @pluv/types@0.18.0
  - @pluv/crdt@0.18.0

## 0.17.3

### Patch Changes

- @pluv/crdt@0.17.3
- @pluv/types@0.17.3

## 0.17.2

### Patch Changes

- @pluv/crdt@0.17.2
- @pluv/types@0.17.2

## 0.17.1

### Patch Changes

- @pluv/crdt@0.17.1
- @pluv/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [507bc00]
  - @pluv/types@0.17.0
  - @pluv/crdt@0.17.0

## 0.16.3

### Patch Changes

- @pluv/crdt@0.16.3
- @pluv/types@0.16.3

## 0.16.2

### Patch Changes

- @pluv/crdt@0.16.2
- @pluv/types@0.16.2

## 0.16.1

### Patch Changes

- @pluv/crdt@0.16.1
- @pluv/types@0.16.1

## 0.16.0

### Patch Changes

- @pluv/crdt@0.16.0
- @pluv/types@0.16.0

## 0.15.0

### Patch Changes

- @pluv/types@0.15.0

## 0.14.1

### Patch Changes

- @pluv/types@0.14.1

## 0.14.0

### Patch Changes

- @pluv/types@0.14.0

## 0.13.0

### Patch Changes

- @pluv/types@0.13.0

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies
  - @pluv/types@0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

### Patch Changes

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

  `@pluv/react`'s `createRoomBundle` now exposes 5 new react hooks: `useCanRedo`, `useCanUndo`, `useRedo`, `useUndo` and `useTransact`.

  Refer to the code-example below to better understand how to undo and redo with your `createRoomBundle`.

  ```tsx
  import { createBundle, createClient, y } from "@pluv/react";
  import { type io } from "./io";

  const client = createClient<typeof io>();

  const { createRoomBundle } = createBundle(client);

  const { useCanRedo, useCanUndo, useRedo, useStorage, useTransact, useUndo } =
    createRoomBundle({
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
  const canUndo: boolean = useCanUndo();
  /**
   * @description Check whether calling redo will mutate storage
   */
  const canRedo: boolean = useCanRedo();

  const [messages, sharedType] = useStorage("messages");

  /**
   * @description Calling transact will enable a storage mutation to be undone/redone.
   * When called without an origin, the origin will default to the user's connection
   * id.
   *
   * You can specify a 2nd parameter to transact with a different transaction origin.
   */
  const transact = useTransact();

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
  const undo = useUndo();

  undo();

  /**
   * @description Re-applies the last undone mutation to storage
   */
  const redo = useRedo();

  redo();
  ```

### Patch Changes

- @pluv/types@0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
  - @pluv/types@0.11.1

## 0.11.0

### Patch Changes

- @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- @pluv/types@0.10.2

## 0.10.1

### Patch Changes

- 885835d: remove unnecessary dependency
- Updated dependencies [885835d]
  - @pluv/types@0.10.1

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

### Patch Changes

- Updated dependencies [f43f1cc]
  - @pluv/types@0.10.0

## 0.4.2

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

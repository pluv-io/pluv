# @pluv/crdt-loro

## 0.37.1

### Patch Changes

- @pluv/crdt@0.37.1
- @pluv/types@0.37.1

## 0.37.0

### Patch Changes

- @pluv/crdt@0.37.0
- @pluv/types@0.37.0

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

- 7c8e7ef: Upgraded `loro-crdt` from `1.3.1` to `1.3.2`.
  - @pluv/crdt@0.35.3
  - @pluv/types@0.35.3

## 0.35.2

### Patch Changes

- Updated dependencies [81cb692]
  - @pluv/types@0.35.2
  - @pluv/crdt@0.35.2

## 0.35.1

### Patch Changes

- 9822786: Added missing `Tree` and `MovableList` types.
- 3cd6571: Added support for undo/redo for `@pluv/crdt-loro`.
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

### Minor Changes

- d99ac96: Require peer dependency loro-crdt@^1.0.0.

### Patch Changes

- f54d8ce: Update internal, deprecated `loro-crdt` methods.
  - @pluv/crdt@0.33.0
  - @pluv/types@0.33.0

## 0.32.9

### Patch Changes

- cef5911: Bump `loro-crdt` from `0.16.12` to `1.0.8`.
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

# @pluv/crdt-loro

## 3.1.2

### Patch Changes

- @pluv/crdt@3.1.2
- @pluv/types@3.1.2

## 3.1.1

### Patch Changes

- @pluv/crdt@3.1.1
- @pluv/types@3.1.1

## 3.1.0

### Patch Changes

- @pluv/crdt@3.1.0
- @pluv/types@3.1.0

## 3.0.0

### Major Changes

- bc1ae91: **BREAKING** Removed deprecated ability to set top-level document types via the yjs shared-type and loro container type utilities (e.g. `yjs.array`, `loro.list`). These must now use the builder type provided in the 1st positional parameter of `yjs.doc` and `loro.doc`.

### Patch Changes

- @pluv/crdt@3.0.0
- @pluv/types@3.0.0

## 2.3.1

### Patch Changes

- @pluv/crdt@2.3.1
- @pluv/types@2.3.1

## 2.3.0

### Patch Changes

- @pluv/crdt@2.3.0
- @pluv/types@2.3.0

## 2.2.8

### Patch Changes

- @pluv/crdt@2.2.8
- @pluv/types@2.2.8

## 2.2.7

### Patch Changes

- @pluv/crdt@2.2.7
- @pluv/types@2.2.7

## 2.2.6

### Patch Changes

- @pluv/crdt@2.2.6
- @pluv/types@2.2.6

## 2.2.5

### Patch Changes

- @pluv/crdt@2.2.5
- @pluv/types@2.2.5

## 2.2.4

### Patch Changes

- @pluv/crdt@2.2.4
- @pluv/types@2.2.4

## 2.2.3

### Patch Changes

- @pluv/crdt@2.2.3
- @pluv/types@2.2.3

## 2.2.2

### Patch Changes

- @pluv/crdt@2.2.2
- @pluv/types@2.2.2

## 2.2.1

### Patch Changes

- @pluv/crdt@2.2.1
- @pluv/types@2.2.1

## 2.2.0

### Patch Changes

- @pluv/crdt@2.2.0
- @pluv/types@2.2.0

## 2.1.0

### Patch Changes

- @pluv/crdt@2.1.0
- @pluv/types@2.1.0

## 2.0.2

### Patch Changes

- 945c47d: Updated deprecation warnings to read that features will be removed in v3 instead of v2.

    Due to an [extremely unfortunate bug in changesets](https://github.com/changesets/changesets/issues/1011), minor and patch changes will create major releases. This caused an unintended v2 release that had no breaking changes. To avoid backtracking and deleting deprecated functionalities right away, the deprecation warnings have been updated so that those APIs will be removed in v3 instead of v2.

    - @pluv/crdt@2.0.2
    - @pluv/types@2.0.2

## 2.0.1

### Patch Changes

- @pluv/crdt@2.0.1
- @pluv/types@2.0.1

## 2.0.0

### Minor Changes

- 0b234d1: **Deprecated** Declaring top-level types on your CRDT storage via the `loro` utility (e.g. `loro.list`) is now deprecated, to be removed in the next major release (v2). Continuing to use the `loro` utility to declare top-level types will log a warning to your console while in development mode (i.e. when `process.env.NODE_ENV === "development"`). To declare top-level types, you should now use the builder type exposed in the storage factory function. See the example below:

    ```ts
    import { loro } from "@pluv/crdt-loro";

    // Before
    loro.doc(() => ({
        // Using the `loro` utility (in this case `loro.map`) when declaring
        // top-level types is now deprecated
        topType: loro.map({
            key1: loro.text(""),
            key2: loro.text(""),
        }),
    }));

    // After
    loro.doc((t) => ({
        // Top-level properties must now use the builder (in this case `t`).
        // This effectively calls `loro.getMap("topType")` to instantiate the type on
        // the root document.
        // This simply returns the native Loro container type (e.g. LoroMap), which
        // allows you operate on your loro container types in a more native way.
        topType: t.map("topType", {
            // Declaring nested types should continue to use the `loro` utilities
            // you've used before
            key1: loro.text(""),
            key2: loro.text(""),
        }),
    }));
    ```

    The functions on the builder type calls the native loro container instantiating methods and returns the native types (e.g. `t.map("topType")` is simply just a `LoroDoc.getMap("topType")`) call under the hood. This allows you to declare your type in a more loro-native and predictable way, and enables declaring more complex initial storage states if needed.

### Patch Changes

- Updated dependencies [047a1d8]
    - @pluv/types@2.0.0
    - @pluv/crdt@2.0.0

## 1.0.2

### Patch Changes

- @pluv/crdt@1.0.2
- @pluv/types@1.0.2

## 1.0.1

### Patch Changes

- @pluv/crdt@1.0.1
- @pluv/types@1.0.1

## 1.0.0

### Major Changes

- af94706: pluv.io is now stable and production ready!

    With this v1 release, pluv.io will now follow [semantic versioning](https://semver.org/) with more comprehensive release notes for future changes to the library.

    Checkout the [full documentation here](https://pluv.io/docs/introduction) to get started today!

### Patch Changes

- Updated dependencies [af94706]
    - @pluv/crdt@1.0.0
    - @pluv/types@1.0.0

## 0.44.2

### Patch Changes

- @pluv/crdt@0.44.2
- @pluv/types@0.44.2

## 0.44.1

### Patch Changes

- @pluv/crdt@0.44.1
- @pluv/types@0.44.1

## 0.44.0

### Patch Changes

- @pluv/crdt@0.44.0
- @pluv/types@0.44.0

## 0.43.0

### Patch Changes

- @pluv/crdt@0.43.0
- @pluv/types@0.43.0

## 0.42.0

### Patch Changes

- @pluv/crdt@0.42.0
- @pluv/types@0.42.0

## 0.41.7

### Patch Changes

- @pluv/crdt@0.41.7
- @pluv/types@0.41.7

## 0.41.6

### Patch Changes

- @pluv/crdt@0.41.6
- @pluv/types@0.41.6

## 0.41.5

### Patch Changes

- @pluv/crdt@0.41.5
- @pluv/types@0.41.5

## 0.41.4

### Patch Changes

- @pluv/crdt@0.41.4
- @pluv/types@0.41.4

## 0.41.3

### Patch Changes

- @pluv/crdt@0.41.3
- @pluv/types@0.41.3

## 0.41.2

### Patch Changes

- @pluv/crdt@0.41.2
- @pluv/types@0.41.2

## 0.41.1

### Patch Changes

- @pluv/crdt@0.41.1
- @pluv/types@0.41.1

## 0.41.0

### Patch Changes

- @pluv/crdt@0.41.0
- @pluv/types@0.41.0

## 0.40.2

### Patch Changes

- @pluv/crdt@0.40.2
- @pluv/types@0.40.2

## 0.40.1

### Patch Changes

- @pluv/crdt@0.40.1
- @pluv/types@0.40.1

## 0.40.0

### Patch Changes

- @pluv/crdt@0.40.0
- @pluv/types@0.40.0

## 0.39.1

### Patch Changes

- @pluv/crdt@0.39.1
- @pluv/types@0.39.1

## 0.39.0

### Patch Changes

- @pluv/crdt@0.39.0
- @pluv/types@0.39.0

## 0.38.14

### Patch Changes

- @pluv/crdt@0.38.14
- @pluv/types@0.38.14

## 0.38.13

### Patch Changes

- @pluv/crdt@0.38.13
- @pluv/types@0.38.13

## 0.38.12

### Patch Changes

- @pluv/crdt@0.38.12
- @pluv/types@0.38.12

## 0.38.11

### Patch Changes

- @pluv/crdt@0.38.11
- @pluv/types@0.38.11

## 0.38.10

### Patch Changes

- @pluv/crdt@0.38.10
- @pluv/types@0.38.10

## 0.38.9

### Patch Changes

- @pluv/crdt@0.38.9
- @pluv/types@0.38.9

## 0.38.8

### Patch Changes

- @pluv/crdt@0.38.8
- @pluv/types@0.38.8

## 0.38.7

### Patch Changes

- @pluv/crdt@0.38.7
- @pluv/types@0.38.7

## 0.38.6

### Patch Changes

- @pluv/crdt@0.38.6
- @pluv/types@0.38.6

## 0.38.5

### Patch Changes

- @pluv/crdt@0.38.5
- @pluv/types@0.38.5

## 0.38.4

### Patch Changes

- @pluv/crdt@0.38.4
- @pluv/types@0.38.4

## 0.38.3

### Patch Changes

- @pluv/crdt@0.38.3
- @pluv/types@0.38.3

## 0.38.2

### Patch Changes

- @pluv/crdt@0.38.2
- @pluv/types@0.38.2

## 0.38.1

### Patch Changes

- @pluv/crdt@0.38.1
- @pluv/types@0.38.1

## 0.38.0

### Patch Changes

- Updated dependencies [f4ceca3]
    - @pluv/types@0.38.0
    - @pluv/crdt@0.38.0

## 0.37.7

### Patch Changes

- @pluv/crdt@0.37.7
- @pluv/types@0.37.7

## 0.37.6

### Patch Changes

- @pluv/crdt@0.37.6
- @pluv/types@0.37.6

## 0.37.5

### Patch Changes

- @pluv/crdt@0.37.5
- @pluv/types@0.37.5

## 0.37.4

### Patch Changes

- @pluv/crdt@0.37.4
- @pluv/types@0.37.4

## 0.37.3

### Patch Changes

- @pluv/crdt@0.37.3
- @pluv/types@0.37.3

## 0.37.2

### Patch Changes

- @pluv/crdt@0.37.2
- @pluv/types@0.37.2

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

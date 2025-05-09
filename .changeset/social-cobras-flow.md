---
"@pluv/crdt-yjs": minor
---

**Deprecated** Declaring top-level types on your CRDT storage via the `yjs` utility (e.g. `yjs.array`) is now deprecated, to be removed in the next major release (v2). Continuing to use the `yjs` utility to declare top-level types will log a warning to your console while in development mode (i.e. when `process.env.NODE_ENV === "development"`). To declare top-level types, you should now use the builder type exposed in the storage factory function. See the example below:

```ts
import { yjs } from "@pluv/crdt-yjs";

// Before
yjs.doc(() => ({
    // Using the `yjs` utility (in this case `yjs.map`) when declaring
    // top-level types is now deprecated
    topType: yjs.map([
        ["key1", yjs.text("")],
        ["key2", yjs.text("")],
    ]),
}));

// After
yjs.doc((t) => ({
    // Top-level properties must now use the builder (in this case `t`).
    // This effectively calls `yjs.getMap("topType")` to instantiate the type on
    // the root document.
    // This simply returns the native Yjs shared-types (e.g. Y.Map), which
    // allows you operate on your yjs shared-typess in a more native way.
    topType: t.map("topType", [
        // Declaring nested types should continue to use the `yjs` utilities
        // you've used before
        ["key1", yjs.text("")],
        ["key2", yjs.text("")],
    ]),
}));
```

The functions on the builder type calls the native yjs shared-type instantiating methods and returns the native types (e.g. `t.map("topType")` is simply just a `Y.Doc.getMap("topType")`) call under the hood. This allows you to declare your type in a more yjs-native and predictable way, and enables declaring more complex initial storage states if needed.

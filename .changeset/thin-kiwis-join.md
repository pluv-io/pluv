---
"@pluv/crdt-loro": minor
---

**Deprecated** Declaring top-level types on your CRDT storage via the `loro` utility (e.g. `loro.list`) is now deprecated, to be removed in the next major release (v2). Continuing to use the `loro` utility to declare top-level types will log a warning to your console while in development mode (i.e. when `process.env.NODE_ENV === "development"`). To declare top-level types, you should now use the builder type exposed in the storage factory function. See the example below:

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

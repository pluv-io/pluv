---
"@pluv/react": minor
---

**Deprecated** Declaring top-level types on your CRDT storage via the `yjs` or `loro` utility (e.g. `yjs.array` or `loro.list`) for the `initialStorage` prop on `PluvRoomProvider` is now deprecated, to be removed in the next major release (v2). Continuing to use the `yjs` or `loro` utilities to declare top-level types will log a warning to your console while in development mode (i.e. when `process.env.NODE_ENV === "development"`). To declare top-level types, you should now use the builder type exposed in the `initialStorage` function. See the example below:

```tsx
import { yjs } from "@pluv/crdt-yjs";

// Before
<PluvRoomProvider
    room="example-room"
    initialStorage={() => ({
        // Using the `yjs` or `loro` utility (in this case `yjs.map`) when
        // declaring top-level types is now deprecated
        topType: yjs.map([
            ["key1", yjs.text("")],
            ["key2", yjs.text("")],
        ]),
    })}
>
    <div />
</PluvRoomProvider>

// After
<PluvRoomProvider
    room="example-room"
    initialStorage={(t) => ({
        // Top-level properties must now use the builder (in this case `t`).
        // This effectively calls `yjs.getMap("topType")` to instantiate the type on
        // the root document.
        // This simply returns the native Yjs shared-types (e.g. Y.Map), which
        // allows you operate on your yjs shared-typess in a more native way.
        topType: t.map("topType", [
            ["key1", yjs.text("")],
            ["key2", yjs.text("")],
        ]),
    })}
>
    <div />
</PluvRoomProvider>
```

The functions on the builder type calls the native yjs shared-type (or loro container type) instantiating methods and returns the native types (e.g. `t.map("topType")` is simply just a `Y.Doc.getMap("topType")`) call under the hood. This allows you to declare your type in a more yjs-native and predictable way, and enables declaring more complex initial storage states if needed.

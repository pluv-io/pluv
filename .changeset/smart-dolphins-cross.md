---
"@pluv/crdt-loro": minor
"@pluv/crdt-yjs": minor
"@pluv/client": minor
"@pluv/react": minor
"@pluv/crdt": minor
---

**BREAKING**: `@pluv/crdt-yjs` and `@pluv/crdt-loro` have been updated so that the utilities to create shared-types/containers no-longer return a wrapper around the underlying shared-types and containers, but rather return the shared-types/containers directly.

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

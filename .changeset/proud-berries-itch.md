---
"@pluv/client": minor
"@pluv/react": minor
"@pluv/io": minor
---

## Breaking Changes

* Storage types are now kept on the root of the document.
    * Previously, `@pluv/crdt-yjs` kept all shared-types on a hidden Yjs Map called `storage` on the root of the Yjs Doc. Now all shared-types are kept on the root of the Yjs Doc instead. This behavior should be more in-line with how shared-types are documented to be used from Yjs.
* `@pluv/client` and `@pluv/react` no-longer re-export `@pluv/crdt-yjs`. This package will now need to be installed separately.
    ```bash
    # if installing @pluv/client
    npm install @pluv/client @pluv/crdt-yjs
    # if installing @pluv/react
    npm install @pluv/react @pluv/crdt-yjs
    ```

    ```ts
    // Before:
    import { createClient, y } from "@pluv/client";
    // After:
    import { createClient } from "@pluv/client";
    import { yjs } from "@pluv/crdt-yjs"; // y renamed to yjs
    ```
* The `y` import has been renamed to `yjs`.
    ```ts
    // Before:
    import { y } from "@pluv/crdt-yjs";
    // After:
    import { yjs } from "@pluv/crdt-yjs";
    ```
* `@pluv/crdt-yjs` functions no-longer return Yjs shared-types directly, but instead return an `AbstractCrdtType` from `@pluv/crdt` (new package). This also affects methods that return storage shared types in both `@pluv/client` and `@pluv/react` from functions like `PluvRoom.getStorage` and `PluvRoom.useStorage`.
    ```ts
    // Before:
    import { y } from "@pluv/crdt-yjs";
    import type { Array as YArray, Map as YMap } from "yjs";

    const array: YArray<YMap<{ message: string }>> = y.array([
        y.object({ message: "Hello" }),
    ]);

    array.push([
        y.object({ message: "World!" }),
    ]);

    // After:
    import type { CrdtYjsArray, CrdtYjsObject } from "@pluv/crdt-yjs";
    import { yjs } from "@pluv/crdt-yjs";
    import type { Array as YArray } from "yjs";

    const array: CrdtYjsArray<CrdtYjsObject<{ message: string }>> = yjs.array([
        yjs.object({ message: "Hello" }),
    ]);

    array.push(yjs.object({ message: "World!" }));

    // use .value to get the underlying yjs type
    const yarray: YArray<YMap<{ message: string }>> = array.value;
    ```
* `initialStorage` must now use the `doc` function from `@pluv/crdt-yjs` to be defined. This also affects `@pluv/react`.
    ```ts
    // Before:
    import { createClient, y } from "@pluv/client";

    const client = createClient({ /* ... */ });

    client.createRoom({
        // ...
        initialStorage: () => ({
            messages: y.array([
                y.object({ message: "Hello world!" }),
            ]),
        }),
    });

    // After:
    import { createClient } from "@pluv/client";
    // This is now imported separately
    import { yjs } from "@pluv/crdt-yjs";

    const client = createClient({ /* ... */ });

    client.createRoom({
        // ...
        initialStorage: yjs.doc(() => ({
            messages: yjs.array([
                yjs.object({ message: "Hello world!" }),
            ]),
        })),
    });
    ```
* `@pluv/client` can now instead use [loro](https://github.com/loro-dev/loro) instead of [yjs](https://github.com/yjs/yjs).
    ```bash
    npm install @pluv/client @pluv/crdt-loro loro-crdt
    ```
* If you are using storage features with pluv, `@pluv/io` must now specify which crdt library (i.e. `@pluv/crdt-yjs` or `@pluv/crdt-loro`) it is meant to use.
    ```ts
    import { loro } from "@pluv/crdt-loro";
    import { yjs } from "@pluv/crdt-yjs";
    import { createIO } from "@pluv/io";

    const io = createIO({
        // ...
        // If using loro
        crdt: loro,
        // If using yjs
        crdt: yjs,
    });
    ```
* `PluvRoom.getDoc()` from `@pluv/client` no-longer returns the Yjs Doc instance, but rather a `AbstractCrdtDoc` instance from `@pluv/crdt`. This also affects the hook from `@pluv/react`.
    ```ts
    // Before:
    import { Doc as YDoc } from "yjs";

    const room: PluvRoom = client.createRoom({ /* ... */ });

    const doc: YDoc = room.getDoc();

    // After:
    import { CrdtYjsDoc } from "@pluv/crdt-yjs";
    import { Doc as YDoc } from "yjs";

    const room: PluvRoom = client.createRoom({ /* ... */ });

    const doc: CrdtYjsDoc<any> = room.getDoc();
    const ydoc: YDoc = doc.value;
    ```
* `@pluv/client` and `@pluv/react` now may return `null` when retrieving storage while storage is being initialized.
    ```ts
    const sharedType = room.getStorage("messages"); // This may be null

    const [data, sharedType] = useStorage("messages"); // data and sharedType may both be null
    ```
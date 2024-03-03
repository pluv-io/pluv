# @pluv/io

## 0.17.0

### Minor Changes

- 507bc00: _BREAKING_: The `authorize` config when calling `createIO` can now also be a function that exposes the platform context.
  This allows accessing the `env` in Cloudflare workers.

  ```ts
  import { createIO } from "@pluv/io";
  import { platformCloudflare } from "@pluv/platform-cloudflare";
  import { z } from "zod";

  const io = createIO({
    authorize: ({ env }) => ({
      required: true,
      secret: env.PLUV_AUTHORIZE_SECRET,
      user: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
    platform: platformCloudflare<{ PLUV_AUTHORIZE_SECRET: string }>(),
    // ...
  });
  ```

  This also requires that the platform contexts are passed to `io.createToken`.

  ```ts
  // If using `platformNode`
  await io.createToken({
    req, // This `IncomingMessage` is now required
    room,
    user: {
      id: "user_123",
      name: "john doe",
    },
  });

  // If using `platformCloudflare`
  await io.createToken({
    env, // This env is now required from the handler's fetch function
    room,
    user: {
      id: "user_123",
      name: "john doe",
    },
  });
  ```

### Patch Changes

- Updated dependencies [507bc00]
  - @pluv/types@0.17.0
  - @pluv/crdt@0.17.0

## 0.16.3

### Patch Changes

- 0bf0934: Moved exposed `@pluv/io` version on the `PluvIO` instance as a property.
  - @pluv/crdt@0.16.3
  - @pluv/types@0.16.3

## 0.16.2

### Patch Changes

- 06f572d: Export the downloaded version of `@pluv/io`.
  - @pluv/crdt@0.16.2
  - @pluv/types@0.16.2

## 0.16.1

### Patch Changes

- cd05d96: Updated outdated README
  - @pluv/crdt@0.16.1
  - @pluv/types@0.16.1

## 0.16.0

### Minor Changes

- 4280220: ## Breaking Changes

  - Storage types are now kept on the root of the document.
    - Previously, `@pluv/crdt-yjs` kept all shared-types on a hidden Yjs Map called `storage` on the root of the Yjs Doc. Now all shared-types are kept on the root of the Yjs Doc instead. This behavior should be more in-line with how shared-types are documented to be used from Yjs.
  - `@pluv/client` and `@pluv/react` no-longer re-export `@pluv/crdt-yjs`. This package will now need to be installed separately.

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

  - The `y` import has been renamed to `yjs`.
    ```ts
    // Before:
    import { y } from "@pluv/crdt-yjs";
    // After:
    import { yjs } from "@pluv/crdt-yjs";
    ```
  - `@pluv/crdt-yjs` functions no-longer return Yjs shared-types directly, but instead return an `AbstractCrdtType` from `@pluv/crdt` (new package). This also affects methods that return storage shared types in both `@pluv/client` and `@pluv/react` from functions like `PluvRoom.getStorage` and `PluvRoom.useStorage`.

    ```ts
    // Before:
    import { y } from "@pluv/crdt-yjs";
    import type { Array as YArray, Map as YMap } from "yjs";

    const array: YArray<YMap<{ message: string }>> = y.array([
      y.object({ message: "Hello" }),
    ]);

    array.push([y.object({ message: "World!" })]);

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

  - `initialStorage` must now use the `doc` function from `@pluv/crdt-yjs` to be defined. This also affects `@pluv/react`.

    ```ts
    // Before:
    import { createClient, y } from "@pluv/client";

    const client = createClient({
      /* ... */
    });

    client.createRoom({
      // ...
      initialStorage: () => ({
        messages: y.array([y.object({ message: "Hello world!" })]),
      }),
    });

    // After:
    import { createClient } from "@pluv/client";
    // This is now imported separately
    import { yjs } from "@pluv/crdt-yjs";

    const client = createClient({
      /* ... */
    });

    client.createRoom({
      // ...
      initialStorage: yjs.doc(() => ({
        messages: yjs.array([yjs.object({ message: "Hello world!" })]),
      })),
    });
    ```

  - `@pluv/client` can now instead use [loro](https://github.com/loro-dev/loro) instead of [yjs](https://github.com/yjs/yjs).
    ```bash
    npm install @pluv/client @pluv/crdt-loro loro-crdt
    ```
  - If you are using storage features with pluv, `@pluv/io` must now specify which crdt library (i.e. `@pluv/crdt-yjs` or `@pluv/crdt-loro`) it is meant to use.

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

  - `PluvRoom.getDoc()` from `@pluv/client` no-longer returns the Yjs Doc instance, but rather a `AbstractCrdtDoc` instance from `@pluv/crdt`. This also affects the hook from `@pluv/react`.

    ```ts
    // Before:
    import { Doc as YDoc } from "yjs";

    const room: PluvRoom = client.createRoom({
      /* ... */
    });

    const doc: YDoc = room.getDoc();

    // After:
    import { CrdtYjsDoc } from "@pluv/crdt-yjs";
    import { Doc as YDoc } from "yjs";

    const room: PluvRoom = client.createRoom({
      /* ... */
    });

    const doc: CrdtYjsDoc<any> = room.getDoc();
    const ydoc: YDoc = doc.value;
    ```

  - `@pluv/client` and `@pluv/react` now may return `null` when retrieving storage while storage is being initialized.

    ```ts
    const sharedType = room.getStorage("messages"); // This may be null

    const [data, sharedType] = useStorage("messages"); // data and sharedType may both be null
    ```

### Patch Changes

- @pluv/crdt@0.16.0
- @pluv/types@0.16.0

## 0.15.0

### Patch Changes

- @pluv/crdt-yjs@0.15.0
- @pluv/types@0.15.0

## 0.14.1

### Patch Changes

- @pluv/crdt-yjs@0.14.1
- @pluv/types@0.14.1

## 0.14.0

### Patch Changes

- @pluv/crdt-yjs@0.14.0
- @pluv/types@0.14.0

## 0.13.0

### Patch Changes

- @pluv/crdt-yjs@0.13.0
- @pluv/types@0.13.0

## 0.12.3

### Patch Changes

- da9f600: Upgraded dependencies
- Updated dependencies [da9f600]
  - @pluv/crdt-yjs@0.12.3
  - @pluv/types@0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

### Patch Changes

- @pluv/crdt-yjs@0.12.1
- @pluv/types@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [436040b]
  - @pluv/crdt-yjs@0.12.0
  - @pluv/types@0.12.0

## 0.11.1

### Patch Changes

- 74b3061: Bumped minor and patch dependencies.
- Updated dependencies [74b3061]
  - @pluv/crdt-yjs@0.11.1
  - @pluv/types@0.11.1

## 0.11.0

### Minor Changes

- b538f5c: Exported class PluvIO from @pluv/io.

### Patch Changes

- @pluv/crdt-yjs@0.11.0
- @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- a7d3ad1: Exposed context and getInitialProps from @pluv/io.
  - @pluv/crdt-yjs@0.10.3
  - @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- 3deee13: Expose type AbstractPlatformConfig from @pluv/io.
  - @pluv/crdt-yjs@0.10.2
  - @pluv/types@0.10.2

## 0.10.1

### Patch Changes

- 0eeb67c: Passed through sessionId and userId into platform websockets.
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

## 0.7.2

### Patch Changes

- Updated dependencies [f4317ba]
  - @pluv/crdt-yjs@0.4.2

## 0.7.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
  - @pluv/crdt-yjs@0.4.1
  - @pluv/types@0.2.2

## 0.7.0

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

## 0.6.0

### Minor Changes

- 2e7cbfa: Updated createIO config option `initialStorage` to be renamed to `getInitialStorage` and updated the params to use an object that includes platform parameters.

  Previously:

  ```ts
  createIO({
      initialStorage(room: string): Promise<string> => {
          // ...
      },
  });
  ```

  Now:

  ```ts
  createIO({
      platform: platformCloudflare<Env>(),
      getInitialStorage({
          // If you're using Cloudflare, this is the Cloudflare env parameter
          env,
          // The name of the room
          room,
      }): Promise<string> => {
          // ...
      },
  });
  ```

## 0.5.0

### Minor Changes

- ae4e1f1: added platform-specific contexts to expose env in cloudflare and req in node.js

## 0.4.2

### Patch Changes

- 8917309: fixed PluvIO listeners onRoomDeleted and onStorageUpdated not working when additional events were added

## 0.4.1

### Patch Changes

- b85a232: bumped dependencies
- Updated dependencies [b85a232]
  - @pluv/crdt-yjs@0.3.8
  - @pluv/types@0.2.0

## 0.4.0

### Minor Changes

- bb2886b: allow sending multiple output types (broadcast, self, sync) per event
- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 41943cf: bumped dependencies
- 0dd847e: updated storage to be synced when reconnected to the room
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
  - @pluv/crdt-yjs@0.3.7
  - @pluv/types@0.2.0

## 0.3.9

### Patch Changes

- abb3622: fixed @pluv/io yjs doc becoming unresponsive when the last user leaves on a cloudflare worker

## 0.3.8

### Patch Changes

- bcf1c3e: purge empty rooms before joining a new room

## 0.3.7

### Patch Changes

- ecc4040: added ability to set debug when room is created

## 0.3.6

### Patch Changes

- a7e2980: deleted links to docs that were removed

## 0.3.5

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
  - @pluv/crdt-yjs@0.3.6

## 0.3.4

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
  - @pluv/crdt-yjs@0.3.5
  - @pluv/types@0.1.6

## 0.3.3

### Patch Changes

- 77069a1: replaced chalk for kleur
  - @pluv/crdt-yjs@0.3.4
  - @pluv/types@0.1.5

## 0.3.2

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
  - @pluv/crdt-yjs@0.3.4

## 0.3.1

### Patch Changes

- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
  - @pluv/crdt-yjs@0.3.3
  - @pluv/types@0.1.5

## 0.3.0

### Minor Changes

- c5567f1: renamed IORoom.room to IORoom.id
- c5567f1: updated IORoom.broadcast to have the same function signature as PluvRoom.broadcast

### Patch Changes

- @pluv/crdt-yjs@0.3.2
- @pluv/types@0.1.4

## 0.2.6

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

## 0.2.5

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
  - @pluv/crdt-yjs@0.3.1
  - @pluv/types@0.1.3

## 0.2.4

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- 3b7b17a: docs: corrected readme typos
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
  - @pluv/crdt-yjs@0.3.0
  - @pluv/types@0.1.3

## 0.2.3

### Patch Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api
- e23fbbe: update demo gif in README
- Updated dependencies [6858682]
  - @pluv/crdt-yjs@0.2.0
  - @pluv/types@0.1.2

## 0.2.2

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
  - @pluv/crdt-yjs@0.1.3
  - @pluv/types@0.1.2

## 0.2.1

### Patch Changes

- b45d642: Fixed links on README
- 203dfee: Updated README
- Updated dependencies [b45d642]
  - @pluv/crdt-yjs@0.1.2

## 0.2.0

### Minor Changes

- 23a7382: Added `initialStorage` param to `createIO` to set initialStorage state of room.
- 39271d4: Added support for IORoom listeners to get current storage state.

### Patch Changes

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

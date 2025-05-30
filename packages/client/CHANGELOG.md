# @pluv/client

## 3.1.7

### Patch Changes

- @pluv/crdt@3.1.7
- @pluv/types@3.1.7

## 3.1.6

### Patch Changes

- @pluv/crdt@3.1.6
- @pluv/types@3.1.6

## 3.1.5

### Patch Changes

- @pluv/crdt@3.1.5
- @pluv/types@3.1.5

## 3.1.4

### Patch Changes

- e443b66: Fixed a case where an empty storage store (e.g. @pluv/addon-indexeddb) would result in an empty initial storage, even when an initial storage was defined.
    - @pluv/crdt@3.1.4
    - @pluv/types@3.1.4

## 3.1.3

### Patch Changes

- @pluv/crdt@3.1.3
- @pluv/types@3.1.3

## 3.1.2

### Patch Changes

- @pluv/crdt@3.1.2
- @pluv/types@3.1.2

## 3.1.1

### Patch Changes

- @pluv/crdt@3.1.1
- @pluv/types@3.1.1

## 3.1.0

### Minor Changes

- 022857d: TypeScript will now emit an error if `initialStorage` was provided to `createClient` while `createIO` was not provided a `crdt`.

    ```ts
    import { createClient, infer } from "@pluv/client";
    import { yjs } from "@pluv/crdt-yjs";
    import { createIO } from "@pluv/io";
    import { platformCloudflare } from "@pluv/platform-cloudflare";

    const io = createIO(
        // Assume no crdt was provided here
        platformCloudflare({
            /* ... */
        }),
    );

    const ioServer = io.server();

    const types = infer((i) => ({ io: i<typeof ioServer> }));
    const client = createClient({
        types,
        // This will now emit a TypeScript error, because `crdt` was not provided to
        // `createIO` above
        initialStorage: yjs.doc((t) => ({
            groceries: t.array<string>("groceries"),
        })),
    });
    ```

### Patch Changes

- @pluv/crdt@3.1.0
- @pluv/types@3.1.0

## 3.0.0

### Major Changes

- bc1ae91: **BREAKING** Removed deprecated `event`, `others`, `storageLoaded`, `storageRoot` and `storage` methods on `PluvRoom`. These methods now exist under `PluvRoom.subscribe`.

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

### Minor Changes

- 3ce1547: Updated typings for `PluvRoom.getDoc` to be narrower to get the native doc type.

    ```ts
    import { createClient } from "@pluv/client";
    import { yjs } from "@pluv/crdt-yjs";
    import type { Doc as YDoc } from "yjs";

    const client = createClient({
        // ...
        crdt: yjs,
    });
    const room = client.createRoom("example-room");

    const doc = room.getDoc();

    // This is now typed as the native YDoc
    doc.value;
    //  ^? const value: YDoc
    ```

- fd3bfe2: Added the ability to listen to the room's underlying websocket's event listeners.
- aee40cb: Updated `presence` types to be more lenient (i.e. no-longer extends `JsonObject`). This is to enable types like `.passthrough` with zod, which can be useful for integrating `yjs.awareness` with libraries such as [lexical](https://lexical.dev/).
- edd1789: **DEPRECATED** `PluvRoom.storageLoaded` will be removed in v3. Added `PluvRoom.getStorageLoaded` with improved detection of when the storage was synced.

    ```ts
    const room = client.createRoom("example-room");

    // Before
    room.storageLoaded;

    // After
    room.getStorageLoaded();
    ```

### Patch Changes

- 48191fa: Fixed `PluvRoom.getDoc` not returning a stable doc reference for a single connection.
    - @pluv/crdt@2.2.0
    - @pluv/types@2.2.0

## 2.1.0

### Minor Changes

- e8d8fbc: **DEPRECATED** Subscribing to data via string parameters on `PluvRoom.subscribe` is deprecated, to be removed in v3. To subscribe to things such as `myself`, `my-presence` and `others`, you must now do so via nested properties on the `subscribe` object (see example below).

    ```ts
    const room = client.createRoom("example-room");

    // Before (now deprecated)
    room.subscribe("connection", (state) => {});
    room.subscribe("my-presence", (myPresence) => {});
    room.subscribe("myself", (myself) => {});
    room.subscribe("others", (others) => {});
    room.subscribe("storage-loaded", (storageLoaded) => {});

    // After
    room.subscribe.connection((state) => {});
    room.subscribe.myPresence((myPresence) => {});
    room.subscribe.myself((myself) => {});
    room.subscribe.others((others) => {});
    room.subscribe.storageLoaded((storageLoaded) => {});
    ```

- d5ac29e: **DEPRECATED** `PluvRoom.event`, `PluvRoom.storage`, `PluvRoom.storageRoot` and `PluvRoom.other` have all been deprecated, to be removed in v3. These now exist under `PluvRoom.subscribe` instead.

    ```ts
    const room = client.createRoom("example-room");

    // Before (now deprecated)
    room.event.receiveMessage((event) => {});
    room.storage.messages((messages) => {});
    room.storageRoot((storage) => {});
    room.other(("id_...", other) => {});

    // After
    room.subscribe.event.receiveMessage((event) => {});
    room.subscribe.storage.messages((messages) => {});
    room.subscribe.storageRoot((storage) => {});
    room.subscribe.other(("id_...", other) => {});
    ```

- 5ca5cb6: Updated `PluvRoom.storage` to also allow subscribing to storage fields as nested properties.

    ```ts
    const client = createClient({
        // ...
        initialStorage: yjs.doc((t) => ({
            messages: yjs.array<string>(),
        })),
    });

    const room = client.createRoom("example-room");

    // The two statements below are equivalent.
    room.storage("messages", (value) => {});

    // You can now subscribe to storage fields as nested properties like so
    room.storage.messages((value) => {});
    ```

- 4acbe1e: Updated `PluvRoom.storage` to also allow subscribing to the root storage when no field is provided.

    ```ts
    const client = createClient({
        // ...
        initialStorage: yjs.doc((t) => ({
            messages: yjs.array<string>(),
        })),
    });

    const room = client.createRoom("example-room");

    room.storage("messages", (value) => {});
    //                        ^? const value: string[];

    // You can now subscribe to the storage root when no key is provided
    room.storage((value) => {});
    //            ^? const value: { messages: string[] };
    ```

- e8d8fbc: Updated `PluvRoom.subscribe` so that `PluvRoom.event` and `PluvRoom.storage` can be accessed as properties under `PluvRoom.subscribe`.

    ```ts
    const room = client.createRoom("example-room");

    // These are now available under the subscribe object
    room.subscribe.event.receiveEvent((event) => {});
    room.subscribe.storage.messages((data) => {});
    ```

### Patch Changes

- a86ff5e: Updated internal types to simplify the type for `PluvRoom.broadcast` and `PluvRoom.event`.
    - @pluv/crdt@2.1.0
    - @pluv/types@2.1.0

## 2.0.2

### Patch Changes

- @pluv/crdt@2.0.2
- @pluv/types@2.0.2

## 2.0.1

### Patch Changes

- 1b93b18: Fixed `ConnectionState` not being exported.
    - @pluv/crdt@2.0.1
    - @pluv/types@2.0.1

## 2.0.0

### Patch Changes

- 047a1d8: Moved several internal types to `@pluv/types`.
- 0806212: Fix the room's id not being defined during the initialization of addons.
- 3a34dbb: Fixed `initialStorage` on `PluvClient.createRoom` not overwriting the `initialStorage` from the `PluvClient` constructor.
- Updated dependencies [047a1d8]
    - @pluv/types@2.0.0
    - @pluv/crdt@2.0.0

## 1.0.2

### Patch Changes

- d87159c: Restored `@pluv/addon-indexeddb` functionality, and fixed `@pluv/addon-indexeddb` sometimes duplicating storage operations based on `initialStorage` values.
    - @pluv/crdt@1.0.2
    - @pluv/types@1.0.2

## 1.0.1

### Patch Changes

- c583be9: Fixed storage race condition that occurred when 2 users joined a room near simultaneously that would cause users to have mismatched storage states from the server (and thereby preventing updates from properly registering) until the user reconnected.
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

- 6cfd36f: Update `PluvRoom` to attempt to reconnect if currently disconnected when the window is re-focused.
    - @pluv/crdt@0.44.2
    - @pluv/types@0.44.2

## 0.44.1

### Patch Changes

- 67c081d: Fix `PluvRoom._reconnect` not being called with the last used metadata (from `PluvRoom.connect`).
    - @pluv/crdt@0.44.1
    - @pluv/types@0.44.1

## 0.44.0

### Minor Changes

- c9fcea5: **BREAKING** The `ConnectionState` enum is now a `const` to avoid several pitfalls of using TypeScript enums.

### Patch Changes

- fba9354: Fix potential edge case where event handlers may be called redundantly.
- bc2d684: Fix `PluvRoom` not properly reconnecting when connections are unavailable.
    - @pluv/crdt@0.44.0
    - @pluv/types@0.44.0

## 0.43.0

### Patch Changes

- 65d9172: Added configurable limits for client-side validation. These should only be updated if you control the server and the server limits have been changed.

    ```ts
    // defaults
    createClient({
        limits: {
            presenceMaxSize: 512,
        },
    });
    ```

    - @pluv/crdt@0.43.0
    - @pluv/types@0.43.0

## 0.42.0

### Patch Changes

- 7ae56bf: Periodically sync connection ids with the server to clear stale connections.
    - @pluv/crdt@0.42.0
    - @pluv/types@0.42.0

## 0.41.7

### Patch Changes

- @pluv/crdt@0.41.7
- @pluv/types@0.41.7

## 0.41.6

### Patch Changes

- 71642fa: Fix error about missing wsEndpoint.
    - @pluv/crdt@0.41.6
    - @pluv/types@0.41.6

## 0.41.5

### Patch Changes

- b3b7b30: Fix error being thrown about missing wsEndpoint when a public key is provided.
    - @pluv/crdt@0.41.5
    - @pluv/types@0.41.5

## 0.41.4

### Patch Changes

- @pluv/crdt@0.41.4
- @pluv/types@0.41.4

## 0.41.3

### Patch Changes

- 49051c0: Fix presence keys becoming lost, causing presence objects to be partial and failing schema validation.
    - @pluv/crdt@0.41.3
    - @pluv/types@0.41.3

## 0.41.2

### Patch Changes

- 37956d3: When presence is received for a user that is not currently being tracked, `PluvRoom` now automatically updates `others` to include the connection of the received presence.
    - @pluv/crdt@0.41.2
    - @pluv/types@0.41.2

## 0.41.1

### Patch Changes

- @pluv/crdt@0.41.1
- @pluv/types@0.41.1

## 0.41.0

### Minor Changes

- 41aa439: **BREAKING** User's presence is now limited to be at most 512 bytes. If the presence is any larger, the `PluvRoom` will now throw an error.
- 555b88d: Users can now have multiple simultaneous connections. Previously, if a user tried to open a connection to a room while already being connected to the room, the new connection would be blocked. Now, when the user opens another connection, the new connection will be opened and initialized with their latest presence.

    Users can only have 1 identity and 1 presence, which means that all presence updates will sync across all of that user's connections. This means that even when a user opens multiple connections, they will only appear once in `others`.

### Patch Changes

- eb2d903: `PluvRoom` attempts to reconnect immediately after receiving a `close` event, instead of waiting for the reconnect timer. After failing the initial reconnect will the reconnects poll on the timer.
- 555b88d: Fixed the `presence` type of `other` and `others` to equal the inferred presence type.
    - @pluv/crdt@0.41.0
    - @pluv/types@0.41.0

## 0.40.2

### Patch Changes

- 6fbc2fe: Update `PluvClient.createRoom` so that the 2nd parameter is optional.
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

### Minor Changes

- e6ddddc: **BREAKING** Moved the `metadata` parameter from the constructor of `PluvRoom` to `PluvClient.connect`. The `metadata` parameter from the constructor of `PluvRoom` is now the validation schema for `metadata` passed through from `PluvClient`.

    This should not be breaking for most users, as the recommended way to enter a room has always been via `PluvClient.enter(room)` (i.e. these are mostly internal-only changes).

    ```ts
    // Before
    const room = new Room("my-room", { metadata: { hello: "world" } });

    await room.connect();

    // After
    const room = new Room("my-room", {
        metadata: z.object({ hello: z.string() }),
    });

    await room.connect({ metadata: { hello: "world" } });
    ```

- e6ddddc: **BREAKING** Moved the `metadata` parameter from `PluvClient.createRoom` to `PluvClient.enter`.

    ```ts
    // Before
    const room = client.createRoom({
        // ...
        metadata: { hello: "world" },
        // ...
    });

    client.enter(room);

    // After
    const room = client.createRoom({
        // ...
    });

    client.enter(room, { metadata });
    ```

### Patch Changes

- e6ddddc: Improved handling of polling-reconnects to `PluvRoom` after the websocket closes (depending on the close event's code).
- 2cfb68d: Add the ability to configure the reconnect timeout (in milliseconds) for a `PluvRoom`, and lowered the default reconnect timeout from 30s to 5s. Values will be automatically clamped to between 1s and 60s.

    ```ts
    // Both of these are valid
    const room = client.createRoom("my-room", {
        // Set timeout to a fixed 10s
        reconnectTimeoutMs: 10_000,
    });

    const room = client.createRoom("my-room", {
        /**
         * `attempts` is the count of failed reconnect attempts, starting from 0 on the first attempt.
         * The returned value will be how long until the next attempt.
         */
        reconnectTimeoutMs: ({ attempts }) => {
            return 10_000 + 1_000 * Math.pow(2, attempts);
        },
    });
    ```

    - @pluv/crdt@0.39.0
    - @pluv/types@0.39.0

## 0.38.14

### Patch Changes

- 886a1f9: Fix cases where the user's own presence was getting updated excessively, and without re-triggering subscriptions.
    - @pluv/crdt@0.38.14
    - @pluv/types@0.38.14

## 0.38.13

### Patch Changes

- @pluv/crdt@0.38.13
- @pluv/types@0.38.13

## 0.38.12

### Patch Changes

- b617726: Fix broken type narrowing for `PluvRoom.event` and `PluvRoom.broadcast`.
    - @pluv/crdt@0.38.12
    - @pluv/types@0.38.12

## 0.38.11

### Patch Changes

- 5ac1aba: Fix the default `wsEndpoint` parameter (for when `@pluv/platform-pluv` is being used).
    - @pluv/crdt@0.38.11
    - @pluv/types@0.38.11

## 0.38.10

### Patch Changes

- cadd963: Update the user's presence locally only via `PluvRoom.updateMyPresence` (i.e. do not update the user's own presence from WebSocket messages) to avoid update delays. This should fix some cases of "jitter" depending on network latecy.
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

- 8346273: Disallow the `# @pluv/client character in router event names.
    - @pluv/crdt@0.38.3
    - @pluv/types@0.38.3

## 0.38.2

### Patch Changes

- de35f0b: Require `PluvRouter` event names to be formatted as valid JavaScript variable names.
    - @pluv/crdt@0.38.2
    - @pluv/types@0.38.2

## 0.38.1

### Patch Changes

- @pluv/crdt@0.38.1
- @pluv/types@0.38.1

## 0.38.0

### Minor Changes

- f4ceca3: Updated internal event names to follow a new naming convention.

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

- a9c3d17: Fix `publicKey` not being properly set on `PluvClient` when `publicKey` is a function.
    - @pluv/crdt@0.37.4
    - @pluv/types@0.37.4

## 0.37.3

### Patch Changes

- 9ae837b: Add missing schema validation for room metadata.
    - @pluv/crdt@0.37.3
    - @pluv/types@0.37.3

## 0.37.2

### Patch Changes

- 11920af: Updated the default `wsEndpoint` for `PluvClient` when `publicKey` is provided to be correct.
    - @pluv/crdt@0.37.2
    - @pluv/types@0.37.2

## 0.37.1

### Patch Changes

- e923a8d: Added support for specifying the `publicKey` param for `createClient` as a function with metadata. This is particularly useful for non-static Next.js applications built with Cloudflare Pages.

    ```ts
    import { createClient } from "@pluv/client";
    import { z } from "zod";

    export const client = createClient({
        // Can be a string
        publicKey: "pk_abc123...",

        // Or can be a function
        metadata: z.object({
            publicKey: z.string().min(1, "Required"),
        }),
        publicKey: ({ metadata }) => metadata.publicKey,
    });
    ```

    - @pluv/crdt@0.37.1
    - @pluv/types@0.37.1

## 0.37.0

### Patch Changes

- @pluv/crdt@0.37.0
- @pluv/types@0.37.0

## 0.36.0

### Minor Changes

- 4518b6d: **BREAKING**
  Updated how `createClient` infers the `PluvServer` type (again 🙁). The property to specify the type-inferred `PluvServer` type has been renamed to `types` from `infer`. `@pluv/client` now exports a function called `infer` that must now be used to construct the inferred `types` property. `infer` must be called before, and outside of `createClient` due to TypeScript inferrence limitations. See examples below:

    ```ts
    // Before

    import { createClient } from "@pluv/client";
    import type { ioServer } from "../server/pluv";

    const client = createClient({
        // ...
        infer: (i) => ({ io: i<typeof ioServer> }),
        // ...
    });

    // After

    import { createClient, infer } from "@pluv/client";
    import type { ioServer } from "../server/pluv";

    // Observe that `types` is initialized outside of `createClient`, instead of
    // inline within the `createClient` function.`
    const types = infer((i) => ({ io: i<typeof ioServer> }));
    const client = createClient({
        // ...
        // Avoid calling `infer` inline within this function like in the commented
        // example below:
        // types: infer((i) => ({ io: i<typeof ioServer> })),
        types,
        // ...
    });
    ```

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

- b18230f: Add `register` helper to improve client initialization when hosted on pluv.io.

    ```ts
    import { createClient, register } from "@pluv/client";
    import type { ioServer } from "./server";

    const client = createClient({
        infer: (i) => ({ io: i<typeof ioServer> }),
        // This includes `wsEndpoint` and therefore should no-longer be manually provided
        ...register({
            // `authEndpoint` and `publicKey` are now required
            authEndpoint: ({ room }) => `${process.env.API_URL}/api/room?room=${room}`,
            publicKey: "pk_...",
        }),
    });
    ```

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

- cff933a: Add `publicKey` property to `createClient` for later usage ;)
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

### Minor Changes

- 19ed36c: **BREAKNG**

    Updated `createClient` and `PluvClient.createRoom` object params to better support automatic type inference.

    ```ts
    // Before
    import { createClient } from "@pluv/client";
    import { yjs } from "@pluv/crdt-yjs";
    import { z } from "zod";
    import type { ioServer } from "./server/ioServer";

    const client = createClient<typeof ioServer>({
        authEndpoint: ({ room }) => "MY_AUTH_URL",
        wsEndpoint: ({ room }) => "MY_WEBSOCKET_URL",
    });

    client.createRoom("my-example-room", {
        presence: z.object({
            selectionId: z.string().nullish(),
        }),
        initialPresence: {
            selectionId: null,
        },
        initialStorage: yjs.doc(() => ({
            messages: yjs.array<string>([]),
        })),
    });

    // After
    const client = createClient({
        authEndpoint: ({ room }) => "MY_AUTH_URL",
        wsEndpoint: ({ room }) => "MY_WEBSOCKET_URL",
        /**
         * @description The ioServer type now needs to be inferred on this property
         * instead of within the generic on `createClient`. This is because of
         * limitations with TypeScript not yet supporting partial type-inference
         * for generics. Ensure to no-loonger include any generics on `createClient`
         */
        infer: (i) => ({ io: i<typeof ioServer> }),
        // Now moved to `createClient` from `PluvClient.createRoom`
        presence: z.object({
            selectionId: z.string().nullish(),
        }),
        /**
         * @description Now added to `createClient` to specify defaults for all
         * rooms, and to infer types for storage. This value will be overwritten by
         * `PluvClient.createRoom`.
         */
        initialStorage: yjs.doc(() => ({
            messages: yjs.array<string>([]),
        })),
    });

    const room = client.createRoom("my-example-room", {
        initialPresence: {
            selectionId: null,
        },
        initialStorage: yjs.doc(() => ({
            messages: yjs.array<string>([]),
        })),
    });
    ```

### Patch Changes

- 19ed36c: Added client-side event router. This more-or-less mirrors the server-side event router. You can use both the server-side and client-side router simultaneously, but you should generally prefer only using one or the other.

    ```ts
    // Backend Server
    import { createIO } from "@pluv/io";

    const io = createIO({
        /* ... */
    });
    const ioServer = io.server({
        router: io.router({
            multiply2: io.procedure
                .input(z.object({ value: z.number() }))
                .broadcast(({ value }) => ({
                    multiplied2: { value: value * 2 },
                })),
        }),
    });

    // Frontend Client
    import { createClient } from "@pluv/client";

    const io = createClient({
        /* ... */
    });

    const room = io.createRoom("my-example-room", {
        // ...
        router: io.router({
            add5: io.procedure.input(z.object({ value: z.number() })).broadcast(({ value }) => ({
                /**
                 * @description Because `ioServer` does not specify `added5`,
                 * this will be forwarded to connected peers.
                 */
                added5: { value: value + 5 },
            })),
            /**
             * @description This is possible, but not recommended to do. Because
             * `multiply2` is a procedure on `ioServer`, this will trigger the
             * `multiply2` procedure on `ioServer`. Connected peers will not
             * receive `multiply2`, but rather `multipled2`.
             */
            subtract5Multiply2: io.procedure
                .input(z.object({ value: z.number() }))
                .broadcast(({ value }) => ({
                    multiply2: { value: value - 5 },
                })),
        }),
    });
    ```

    - @pluv/crdt@0.27.0
    - @pluv/types@0.27.0

## 0.26.0

### Minor Changes

- 19e5dda: **BREAKING**
  Update `authEndpoint` and `wsEndpoint` to now use a parameterized object that passes through additional data via a `metadata` property.

    ```tsx
    // Before

    import { env } from "./env";
    import type { ioServer } from "./server";

    const client = createClient<typeof ioServer>({
        authEndpoint: (room: string) => `${env.API_URL}}/room/${room}`,
        wsEndpoint: (room: string) => `${env.WS_URL}/room/${room}`,
    });

    // After

    const client = createClient<
        typeof ioServer,
        // Optional: You can specify types for metadata here. This is useful for Cloudflare Pages
        { apiUrl: string; wsUrl: string }
    >({
        authEndpoint: ({ metadata, room }) => `${metadata.apiUrl}}/room/${room}`,
        wsEndpoint: ({ metadata, room }) => `${{ metadata.wsUrl }}/room/${room}`,
    });

    client.createRoom("my-room", {
        // This property exists when the `metadata` generic type is defined above
        metadata: {
            apiUrl: "https://example.com/api",
            wsUrl: "wss://example.com/api",
        },
        // ...
    });

    <PluvRoomProvider
        // This property exists when the `metadata` generic type is defined above
        metadata={{
            apiUrl: "https://example.com/api",
            wsUrl: "wss://example.com/api",
        }}
    >
        {/* ... */}
    </PluvRoomProvider>
    ```

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

- ba299e2: Fixed "others" state in the PluvClient not getting cleared when the user's websocket connection is closed, creating "ghost users" during some reconnects.
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

### Minor Changes

- b98ab6b: Internal updates to platforms (i.e. `@pluv/platform-cloudflare` and `@pluv/platform-node`) to be able to support Cloudflare Worker Websocket Hibernation APIs.

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

- 137444b: Updated PluvRoom.updateMyPresence to allow passing in a callback function that exposes the previous presence value and returns a presence update.

    ```ts
    type Presence = {
        selectionId: string | null;
    };

    const room: PluvRoom = /* ... */;
    const newSelectionId: string | null = /* ... */;

    room.updateMyPresence({ selectionId: newSelection });

    // You can reference the previous presence and return a new presence based on it
    room.updateMyPresence((previousPresence) => ({ selectionId: newSelection ?? previousPresence.selectionId }));
    ```

- f5e4370: Fix others' presence not getting tracked in PluvRoom when the user is unauthorized.
    - @pluv/crdt@0.19.0
    - @pluv/types@0.19.0

## 0.18.0

### Minor Changes

- 99b5ca9: ## Breaking Changes

    - `@pluv/io` has been updated to introduce `PluvProcedure`, `PluvRouter` and `PluvServer`. This change is intended to improve the ergonomics of declaring events and simplifying inferences of event types.

    ### Before:

    ```ts
    // backend/io.ts

    import { createIO } from "@pluv/io";
    import { createPluvHandler, platformNode } from "@pluv/platform-node";
    import { z } from "zod";

    export const io = createIO({
        platform: platformNode(),
    })
        .event("SEND_MESSAGE", {
            input: z.object({ message: z.string() }),
            resolver: ({ message }) => ({ RECEIVE_MESSAGE: { message } }),
        })
        .event("DOUBLE_VALUE", {
            input: z.object({ value: z.number() }),
            resolver: ({ value }) => ({ VALUE_DOUBLED: { value: value * 2 } }),
        });

    const Pluv = createPluvHandler({
        io,
        /* ... */
    });
    ```

    ```ts
    // frontend/pluv.ts

    import { createClient } from "@pluv/react";
    import type { io } from "../backend/io";

    const client = createClient<typeof io>({
        /* ... */
    });
    ```

    ### Now:

    ```ts
    import { createIO } from "@pluv/io";
    import { createPluvHandler, platformNode } from "@pluv/platform-node";
    import { z } from "zod";

    const io = createIO({
        platform: platformNode(),
    });

    const router = io.router({
        SEND_MESSAGE: io.procedure
            .input(z.object({ message: z.string() }))
            .broadcast(({ message }) => ({
                RECEIVE_MESSAGE: { message },
            })),
        DOUBLE_VALUE: io.procedure
            .input(z.object({ value: z.number() }))
            .broadcast(({ value }) => ({
                VALUE_DOUBLED: { value: value * 2 },
            })),
    });

    export const ioServer = io.server({ router });

    const Pluv = createPluvHandler({
        io: ioServer, // <- This uses the PluvServer now
        /* ... */
    });
    ```

    ```ts
    // frontend/pluv.ts

    import { createClient } from "@pluv/react";
    import type { ioServer } from "../backend/io";

    // This users the PluvServer type now
    const client = createClient<typeof ioServer>({
        /* ... */
    });
    ```

    - `PluvRouter` instances can also be merged via the `mergeRouters` method, which effectively performs an `Object.assign` of the events object and returns a new `PluvRouter` with the correct types:

    ```ts
    const router = io.mergeRouters(router1, router2);
    ```

### Patch Changes

- 06c67be: Added broadcast proxy as a new way to broadcast events.

    ```ts
    // backend

    const router = io.router({
        SEND_MESSAGE: io.procedure
            .input(z.object({ message: z.string() }))
            .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
    });

    // frontend
    const client = createClient(/* ... */);

    // Both of the examples below are equivalent.

    client.broadcast("SEND_MESSAGE", { message: "Hello world~!" });

    client.broadcast.SEND_MESSAGE({ message: "Hello world~!" });
    ```

- df1342c: Added event proxy as a new way to listen to events.

    ```ts
    // backend

    const router = io.router({
        SEND_MESSAGE: io.procedure
            .input(z.object({ message: z.string() }))
            .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
    });

    // frontend
    const client = createClient(/* ... */);

    // Both of the examples below are equivalent.

    client.event("RECEIVE_MESSAGE", ({ data }) => {
        const { message } = data;

        console.log(message);
    });

    client.event.RECEIVE_MESSAGE(({ data }) => {
        const { message } = data;

        console.log(message);
    });
    ```

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

        const array: YArray<YMap<{ message: string }>> = y.array([y.object({ message: "Hello" })]);

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

### Minor Changes

- 1126215: Added `getDoc` on `PluvRoom` to access the root Yjs doc.

    ```ts
    import { createClient } from "@pluv/client";
    import type { Doc } from "yjs";

    const client = createClient(/* ... */);
    const room = client.createRoom(/* ... */);

    const doc: Doc = room.getDoc();
    ```

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

- cae08aa: Updated storage from `getStorage` to never return null
    - @pluv/crdt-yjs@0.12.1
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

    const { useCanRedo, useCanUndo, useRedo, useStorage, useTransact, useUndo } = createRoomBundle({
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

### Patch Changes

- @pluv/crdt-yjs@0.11.0
- @pluv/types@0.11.0

## 0.10.3

### Patch Changes

- @pluv/crdt-yjs@0.10.3
- @pluv/types@0.10.3

## 0.10.2

### Patch Changes

- @pluv/crdt-yjs@0.10.2
- @pluv/types@0.10.2

## 0.10.1

### Patch Changes

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

## 0.9.2

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
    - @pluv/crdt-yjs@0.4.2

## 0.9.1

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies
- Updated dependencies [8fba48b]
- Updated dependencies [8997c65]
    - @pluv/crdt-yjs@0.4.1
    - @pluv/types@0.2.2

## 0.9.0

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

## 0.8.1

### Patch Changes

- 2c9c5c3: changed my-presence to be non-nullable

## 0.8.0

### Minor Changes

- fde89cf: added defaults to the client to align it with createPluvClient by default

### Patch Changes

- 5bbfb98: fix not properly handling unauthorized checks
- b85a232: bumped dependencies
- Updated dependencies [b85a232]
    - @pluv/crdt-yjs@0.3.8
    - @pluv/types@0.2.0

## 0.7.0

### Minor Changes

- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room
- bb2886b: fixed not reconnecting during heartbeat
- 3518a83: bumped dependencies
- Updated dependencies [0dd847e]
- Updated dependencies [bb2886b]
- Updated dependencies [ae679a8]
- Updated dependencies [3518a83]
    - @pluv/crdt-yjs@0.3.7
    - @pluv/types@0.2.0

## 0.6.5

### Patch Changes

- 7ad4967: fixed user's presence not updating locally while offline
- 4535687: fix local yjs doc not updating while disconnected
    - @pluv/crdt-yjs@0.3.6
    - @pluv/types@0.1.6

## 0.6.4

### Patch Changes

- 78fd644: updated readmes with links to the documentation website
- Updated dependencies [78fd644]
    - @pluv/crdt-yjs@0.3.6

## 0.6.3

### Patch Changes

- 850626e: bumped dependencies
- Updated dependencies [850626e]
    - @pluv/crdt-yjs@0.3.5
    - @pluv/types@0.1.6

## 0.6.2

### Patch Changes

- 9ae251d: bumped dependencies
- Updated dependencies [9ae251d]
    - @pluv/crdt-yjs@0.3.4

## 0.6.1

### Patch Changes

- 19433af: updated MockedRoomProvider events to allow partial events
- 74870ee: bumped dependencies
- Updated dependencies [74870ee]
    - @pluv/crdt-yjs@0.3.3
    - @pluv/types@0.1.5

## 0.6.0

### Minor Changes

- e1308e3: changed `PluvClient.createRoom` to have optional options.
- e1308e3: changed `PluvClient.enter` to return the `PluvRoom` that was entered.

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

## 0.5.1

### Patch Changes

- 161e00e: fixed links to other pluv packages in readmes
- f6c0e65: bumped dependencies
- Updated dependencies [161e00e]
- Updated dependencies [f6c0e65]
    - @pluv/crdt-yjs@0.3.1
    - @pluv/types@0.1.3

## 0.5.0

### Minor Changes

- 327a6ef: renamed y.unstable\_\_object to y.object

### Patch Changes

- 78a6119: Fixed MockedRoom not sending storage updates
- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- b1cb325: Updated dependencies
- 8e97fb2: Updated dependencies
- Updated dependencies [8bf62cb]
- Updated dependencies [7e52685]
- Updated dependencies [b1cb325]
- Updated dependencies [327a6ef]
- Updated dependencies [8e97fb2]
    - @pluv/crdt-yjs@0.3.0
    - @pluv/types@0.1.3

## 0.4.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.3.0

### Minor Changes

- 595e66f: added mocked-room for mocking a client-side room for testing

## 0.2.0

### Minor Changes

- 95b5ef8: breaking: update PluvRoom.broadcast api

### Patch Changes

- Updated dependencies [6858682]
    - @pluv/crdt-yjs@0.2.0
    - @pluv/types@0.1.2

## 0.1.3

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme
- Updated dependencies [fe80d7b]
    - @pluv/crdt-yjs@0.1.3
    - @pluv/types@0.1.2

## 0.1.2

### Patch Changes

- Updated dependencies [b45d642]
    - @pluv/crdt-yjs@0.1.2

## 0.1.1

### Patch Changes

- 23a7382: Omitted unused `encodedState` param from PluvRoom.
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

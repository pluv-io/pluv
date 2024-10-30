# @pluv/io

## 0.32.9

### Patch Changes

- @pluv/crdt@0.32.9
- @pluv/types@0.32.9

## 0.32.8

### Patch Changes

- e659f8a: Update `getInitialStorage` so that the context is made available on the `context` event property.

  ```ts
  import { createIO } from "@pluv/io";

  // Before
  const io = createIO({
    getInitialStorage: ({ room, ...context }) => {
      // ...
    },
  });

  // After
  const io = createIO({
    // Context is now an explicit property on the event
    getInitialStorage: ({ room, context }) => {
      // ...
    },
  });
  ```

  - @pluv/crdt@0.32.8
  - @pluv/types@0.32.8

## 0.32.7

### Patch Changes

- @pluv/crdt@0.32.7
- @pluv/types@0.32.7

## 0.32.6

### Patch Changes

- c0956e7: Add `onUserConnected` and `onUserDisconnected` events on `PluvServer`.

  ```ts
  import { createIO } from "@pluv/io";

  const io = createIO({
    /* ... */
  });

  const ioServer = io.server({
    // ...
    onUserConnected: (event) => {
      // ...
    },
    onUserDisconnected: (event) => {
      // ...
    },
  });
  ```

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

- bb21274: Added the ability to evict (i.e. close) a connection to a room via `IORoom.evict` and `IORoom.evictAll`.
  - @pluv/crdt@0.32.3
  - @pluv/types@0.32.3

## 0.32.2

### Patch Changes

- 890d45b: Update `onRoomMessage` and `onStorageUpdated` events to include the WebSocket as part of the `event` parameter of those listeners.
  - @pluv/crdt@0.32.2
  - @pluv/types@0.32.2

## 0.32.1

### Patch Changes

- @pluv/crdt@0.32.1
- @pluv/types@0.32.1

## 0.32.0

### Minor Changes

- cde5305: **BREAKING**

  Update `createIO`'s `context` property to allow lazy initialization as a function. The `context` also no-longer contains platform-specific values by default. See example below:

  ```ts
  import { createIO } from "@pluv/io";
  import { platformCloudflare } from "@pluv/platform-cloudflare";
  import { Database } from "./database";

  // Before
  const io = createIO({
    platform: platformCloudflare(),
    context: {
      // Maybe you need to access `env` for Cloudflare, but it's not accessible
      // here
      db: new Database(env.DATABASE_URL),
      // ^ Does not exist

      // Even though it's not specified in this `context`, Cloudflare's
      // env and state values were previously available where context
      // was referenced
    },
  });

  // After
  const io = createIO({
    platform: platformCloudfare(),
    context: ({ env, state }) => ({
      db: new Database(env.DATABASE_URL),
      // ^ Now accessible

      // Now these must be forwarded to use them
      env,
      state,
    }),
  });
  ```

### Patch Changes

- @pluv/crdt@0.32.0
- @pluv/types@0.32.0

## 0.31.0

### Minor Changes

- b3c31d7: **BREAKING**

  Fixed platform context types. This will require additional properties when registering a websocket and creating authorization tokens. See example below:

  ```ts
  // @pluv/platform-node example

  import { platformNode } from "@pluv/platform-node";
  import { createIO } from "@pluv/io";
  import type { IncomingMessage } from "node:http";
  import { z } from "zod";

  const io = createIO({
      // If using a function authorize parameter, `req` is now available as a param
      authorize: ({ req }) => ({
          required: true,
          secret: "MY-CUSTOM-SECRET",
          user: z.object({
              id: z.string(),
          }),
      }),
      platformNode(),
  });

  // Before
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },
  });

  // After
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },

      // Previously not required, but now required
      req: req as IncomingMessage,
  });
  ```

  ```ts
  // @pluv/platform-cloudflare example

  import { platformCloudflare } from "@pluv/platform-cloudflare";
  import { createIO } from "@pluv/io";
  import { z } from "zod";

  const io = createIO({
      // If using a function authorize parameter, `env` and `request` are now available as params
      authorize: ({ env, request }) => ({
          required: true,
          secret: "MY-CUSTOM-SECRET",
          user: z.object({
              id: z.string(),
          }),
      }),
      platformCloudflare(),
  });

  // Before
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },
  });

  // After
  io.createToken({
      room: "my-custom-room",
      user: { id: "abc123" },

      // Previously not required, but now required
      env: env as Env,
      request: request as Request,
  });
  ```

### Patch Changes

- @pluv/crdt@0.31.0
- @pluv/types@0.31.0

## 0.30.2

### Patch Changes

- @pluv/crdt@0.30.2
- @pluv/types@0.30.2

## 0.30.1

### Patch Changes

- b9c3633: Export the `authorize` utility from `@pluv/io`.
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

- 19ed36c: Fixed custom events not properly registering on IORoom.
- e309b0b: Events without a procedure will now automatically be passed-through to connected peers as-if they were broadcast.

  ```tsx
  // backend

  const io = createIO({
    /* ... */
  });

  const ioServer = io.server({
    router: io.router({
      sendGreeting: io.procedure
        .input(z.object({ name: z.string() }))
        .broadcast(({ name }) => ({
          receiveGreeting: { greeting: `Hi, I'm ${name}!` },
        })),
    }),
  });

  // frontend

  const broadcast = useBroadcast();

  // This will be captured in the server procedure and emit receiveGreeting
  broadcast.sendGreeting({ name: "leedavidcs" });

  event.receiveGreeting.useEvent(({ data }) => {
    console.log(data.greeting);
  });

  // This is not captured by any server procedure and will be broadcast to peers as-is

  broadcast.myCustomUncaughtEvent({ randomData: "Hello world!" });

  // This will be be received by all connections, passed as-is from the server
  event.myCustomUncaughtEvent.useEvent(({ data }) => {
    console.log(data.randomData);
  });
  ```

  - @pluv/crdt@0.27.0
  - @pluv/types@0.27.0

## 0.26.0

### Patch Changes

- @pluv/crdt@0.26.0
- @pluv/types@0.26.0

## 0.25.4

### Patch Changes

- 7a9080c: Fix not passing all properties to the platform initialization.
  - @pluv/crdt@0.25.4
  - @pluv/types@0.25.4

## 0.25.3

### Patch Changes

- 50d9b96: Export listener and event types.
  - @pluv/crdt@0.25.3
  - @pluv/types@0.25.3

## 0.25.2

### Patch Changes

- 60a0bf1: Update internal accessor.
  - @pluv/crdt@0.25.2
  - @pluv/types@0.25.2

## 0.25.1

### Patch Changes

- 3925f7c: Update internal accessor.
  - @pluv/crdt@0.25.1
  - @pluv/types@0.25.1

## 0.25.0

### Minor Changes

- 9db06ba: **BREAKING **

  Fixed typos `persistance` to `persistence`.

  This does mean that all properties referencing `persistance` will need to be fixed. Examples below:

  ```bash
  # Re-install @pluv/persistence-redis
  pnpm uninstall @pluv/persistance-redis
  pnpm install @pluv/persistence-redis
  ```

  ```ts
  // Before
  createIO({
    platform: platformNode({
      persistance: new PersistanceRedis(/* ... */),
    }),
  });

  // After
  createIO({
    platform: platformNode({
      persistence: new PersistenceRedis(/* ... */),
    }),
  });
  ```

  `@pluv/persistance-redis` has been deprecated for `@pluv/persistence-redis`.

### Patch Changes

- 4e078ca: Fix IORoom onRoomMessage event triggering on message sent instead of on message received.
- f556d30: Refactored PluvServer and IORoom properties to consolidate internal properties.
  - @pluv/crdt@0.25.0
  - @pluv/types@0.25.0

## 0.24.1

### Patch Changes

- @pluv/crdt@0.24.1
- @pluv/types@0.24.1

## 0.24.0

### Minor Changes

- 6ac8a46: \* Fixed errors thrown when using Cloudflare's websocket hibernation API caused by rooms being re-used between different instances of DurableObjects.

  - Add configurable `onDelete` and `onMessage` event listeners that can be set when rooms are created.

  **BREAKING**

  - Changed `PluvServer.getRoom` to `PluvServer.createRoom`. This means `PluvServer` only handles room creation. Room management must now be handled manually. This mainly affects manually creating rooms with `@pluv/platform-node`, and will likely not affect you if you are either using `createPluvHandler` on any platform, or if you are using `@pluv/platform-cloudflare`.

  ```ts
  // For @pluv/platform-node

  // Before

  import { createIO } from "@pluv/io";

  const io = createIO(/* ... */);
  const ioServer = io.server(/* ... */);

  const roomId = "my-room-id";
  const room = ioServer.getRoom(roomId);

  // After

  import { createIO, type InferIORoom } from "@pluv/io";

  const io = createIO(/* ... */);
  const ioServer = io.server(/* ... */);

  const rooms = new Map<string, InferIORoom<typeof ioServer>>();

  const roomId = "my-room-id";
  const room = ioServer.createRoom(roomId, {
    // Use new onDelete event listener
    onDelete: (event) => {
      rooms.delete(event.room);
    },
  });

  rooms.set(roomId, room);
  ```

- c26986d: Fixed websocket messages getting lost after the Cloudflare Worker Durable Object wakes up from hibernation.

  **BREAKING**

  Updated `onMessage`, `onClose` and `onError` to all return `Promise.void` instead of `void`.

  ```ts
  // Before

  const io = createIO(/* ... */);
  const ioServer = io.server(/* ... */);

  class RoomDurableObject implements DurableObject {
    public webSocketClose(ws: WebSocket, code: number, reason: string): void {
      const handler = this._room.onClose(ws);

      // Previously returned `void`
      handler({ code, reason });
    }

    public webSocketError(ws: WebSocket, error: unknown): void {
      const handler = this._room.onError(ws);
      const eventError =
        error instanceof Error ? error : new Error("Internal Error");

      // Previously returned `void`
      handler({ error: eventError, message: eventError.message });
    }

    public webSocketMessage(
      ws: WebSocket,
      message: string | ArrayBuffer,
    ): void {
      const handler = this._room.onMessage(ws);

      // Previously returned `void`
      handler({ data: message });
    }
  }

  // After

  const io = createIO(/* ... */);
  const ioServer = io.server(/* ... */);

  class RoomDurableObject implements DurableObject {
    public async webSocketClose(
      ws: WebSocket,
      code: number,
      reason: string,
    ): Promise<void> {
      const handler = this._room.onClose(ws);

      // Handler must now be awaited
      await handler({ code, reason });
    }

    public async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
      const handler = this._room.onError(ws);
      const eventError =
        error instanceof Error ? error : new Error("Internal Error");

      // Handler must now be awaited
      await handler({ error: eventError, message: eventError.message });
    }

    public async webSocketMessage(
      ws: WebSocket,
      message: string | ArrayBuffer,
    ): Promise<void> {
      const handler = this._room.onMessage(ws);

      // Handler must now be awaited
      await handler({ data: message });
    }
  }
  ```

### Patch Changes

- @pluv/crdt@0.24.0
- @pluv/types@0.24.0

## 0.23.0

### Minor Changes

- c01b16f: **BREAKING**

  Moved `getInitialStorage`, `onRoomDeleted` and `onStorageUpdated` from `createIO` to `PluvIO.server`.

  ```ts
  import { createIO } from "@pluv/io";

  // Before
  const io = createIO({
    // ...
    getInitialStorage: (event) => {
      // ...
    },
    onRoomDeleted: (event) => {
      // ...
    },
    onStorageUpdated: (event) => {
      // ...
    },
    // ...
  });

  const ioServer = io.server({
    // ...
  });

  // After
  const io = createIO({
    // ...
  });

  const ioServer = io.server({
    // ...
    getInitialStorage: (event) => {
      // ...
    },
    onRoomDeleted: (event) => {
      // ...
    },
    onStorageUpdated: (event) => {
      // ...
    },
    // ...
  });
  ```

  Added a new listener `onRoomMessage` to `PluvIO.server` to listen to events that are sent within a room.

  ```ts
  const ioServer = io.server({
    // ...
    onRoomMessage: (event) => {
      console.log(event.message);
      console.log(event.user);
    },
    // ...
  });
  ```

### Patch Changes

- @pluv/crdt@0.23.0
- @pluv/types@0.23.0

## 0.22.0

### Minor Changes

- 650e577: \* Fix `@pluv/platform-cloudflare` causing frequent disconnects due to incorrect heartbeat handling.
  - Updated default `mode` of `@pluv/platform-cloudflare` back to `"detached"` (i.e. use Cloudflare Worker Hibernation API by default).

### Patch Changes

- @pluv/crdt@0.22.0
- @pluv/types@0.22.0

## 0.21.1

### Patch Changes

- @pluv/crdt@0.21.1
- @pluv/types@0.21.1

## 0.21.0

### Minor Changes

- 307bd44: `@pluv/platform-cloudflare` now supports Cloudflare Worker's WebSocket Hibernation API, and usees it by default.

  To switch back to not using the WebSocket Hibernation API, specify a `mode` of `attached`.

  ```ts
  // With event-listeners directly attached to the websocket on registration (i.e. non-hibernation)
  createIO({
    platform: platformCloudflare({
      mode: "attached",
    }),
  });

  // With event listeners unattached to the websocket during registration (i.e. hibernation)
  createIO({
    platform: platformCloudflare({
      mode: "detached",
    }),
  });
  ```

- 41b15e4: **BREAKING** - Updated `sessions` type in the procedure context from `Map<string, WebSocketSession>` to `readonly WebSocketSession[]`.
- f570c8a: **BREAKING**: The original request object is no longer available in the context of any event resolvers.

  Previously, the request object that was passed into `PluvServer.getRoom` would be made available on the context object of each of the resolvers. This is no-longer a part of the event context, and therefore needs to be omitted from calls to `PluvServer.getRoom`.

  ```ts
  // Before

  // With platform-node
  ioServer.getRoom(websocket, { req, token });

  // With platform-cloudflare
  ioServer.getRoom(websocket, { env, req, token });
  ```

  ```ts
  // Now

  // With platform-node
  ioServer.getRoom(websocket, { req });

  // With platform-cloudflare
  ioServer.getRoom(websocket, { env, req });
  ```

- b98ab6b: Internal updates to platforms (i.e. `@pluv/platform-cloudflare` and `@pluv/platform-node`) to be able to support Cloudflare Worker Websocket Hibernation APIs.
- 4c2228d: **BREAKING**: Require `DurableObjectState` in `ioServer.getRoom`.

  ```ts
  // Before

  // With platform-cloudflare
  ioServer.getRoom(websocket, { env, req });
  ```

  ```ts
  // Now

  // With platform-cloudflare
  ioServer.getRoom(websocket, { env, req, state });
  ```

### Patch Changes

- cc2613e: Moved `sessionId` from being derived in `IORoom` to being derived as a getter in `AbstractWebsocket`.
  - @pluv/crdt@0.21.0
  - @pluv/types@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [9492085]
  - @pluv/crdt@0.20.0
  - @pluv/types@0.20.0

## 0.19.0

### Patch Changes

- @pluv/crdt@0.19.0
- @pluv/types@0.19.0

## 0.18.0

### Minor Changes

- 428c21c: Added broadcast proxy as a new way to broadcast events to a room.

  ```tsx
  // backend

  const io = createIO({
    /* ... */
  });

  const router = io.router({
    SEND_MESSAGE: io.procedure
      .input(z.object({ message: z.string() }))
      .broadcast(({ message }) => ({ RECEIVE_MESSAGE: { message } })),
  });

  const ioServer = io.server({ router });

  const room = ioServer.getRoom("MY_EXAMPLE_ROOM");

  // Both of the examples below are equivalent.

  room.broadcast("SEND_MESSAGE", { message: "Hello world~!" });

  room.broadcast.SEND_MESSAGE({ message: "Hello world~!" });
  ```

- 329dbcd: Narrowed types for `user` within the session object of an event resolver.
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

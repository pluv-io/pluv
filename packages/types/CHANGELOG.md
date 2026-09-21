# @pluv/types

## 6.0.0

### Major Changes

- 4058575: `UserInfo` is keyed by person, and rooms expose size without listing everyone.

    - `UserInfo` is `{ data, presence }`. Look up others by `data.id` (`useOther` / `getOther`), not a WebSocket connection id. `getOtherByConnectionId` maps a socket id to that person.

    ```ts
    // Before
    useOther(connectionId, (other) => other.presence.cursor);
    useMyself(({ user }) => user.id);

    // After
    useOther(userId, (other) => other.presence.cursor);
    useMyself(({ data }) => data.id);
    ```

    - `useOthers()` / `getOthers()` still list everyone else who has presence.

    ```ts
    // Before
    others.map((other) => (
      <Cursor key={other.connectionId} user={other.user} />
    ));

    // After
    others.map((other) => (
      <Cursor key={other.data.id} user={other.data} />
    ));
    ```

    - `useRoomStats()` / `getRoomStats()` report live `connectionCount` and `userCount` (including you). Use `userCount` for a viewer count; `useOthers().length` does not include you.

    ```ts
    const { connectionCount, userCount } = useRoomStats();

    const viewers = useRoomStats((stats) => stats.userCount);
    const stats = room.getRoomStats(); // { connectionCount, userCount }
    ```

    - `room.listUsers({ cursor, limit })` pages everyone currently in the room (including you), identities only, on both the client room and server `IORoom`. It is not a live store: people who join or leave while you page can be skipped or duplicated. `limit` defaults to 50 and must be an integer from 1 to 100. Returns `{ success: true, users, pageInfo }` or `{ success: false, error: { code, message } }`. Client `listUsers` can also fail with `FAILED` if the request times out.

    ```ts
    const room = useRoom();

    const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ["listUsers", room.id],
        queryFn: async ({ pageParam }) => {
            const result = await room.listUsers({ cursor: pageParam, limit: 50 });

            if (!result.success) throw new Error(result.error.message);

            return result;
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => {
            return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.endCursor : undefined;
        },
    });
    // result.users: { data }[]
    // result.pageInfo: { endCursor, hasNextPage }
    ```

    - Rooms default `maxConnections` to 256. Extra sockets are rejected. Raise `limits.maxConnections` for larger rooms; large values also require `limits.dangerouslyAllowHighPresenceFanout: true`.

- ba6805a: Require Cloudflare WebSocket hibernation and SQLite-backed Durable Object storage.

    `platformCloudflare({ mode: "attached" })` (standard WebSocket API listeners) is no longer supported. Durable Objects must implement `webSocketMessage`, `webSocketClose`, and `webSocketError` and forward them to the room.

    Key-value Durable Object storage is no longer supported. `PersistenceCloudflareTransactionalStorage({ mode: "kv" })` has been removed; persistence always uses SQLite. Create rooms with `new_sqlite_classes` (or `"storage": "sqlite"`). Existing KV-backed namespaces need a new SQLite Durable Object class and a data move—Cloudflare does not offer an in-place storage-backend switch.

- 0ee9d2d: Replace `yjs.doc((t) => …)` / `loro.doc((t) => …)` with a schema builder and JSON seeds.

    Declare storage with `yjs.schema({ … })` / `loro.schema({ … })` on the shared treaty (the schema object is the factory). Seed with JSON in `initialStorage`. Room-level `initialStorage` is JSON only, not a builder. `useStorage` and `getStorage` return native Yjs/Loro types instead of `YjsType` / `LoroType` wrappers. `CrdtType` and `InferCrdtJson` are removed.

- 4058575: Drop `@pluv/pubsub-redis` and `io.procedure.sync()`. A live room is not split across Node processes; occupancy, presence, and `listUsers` stay local. `@pluv/persistence-redis` still persists CRDT storage, and `platformNode({ persistence })` no longer takes `pubSub`.
- 4058575: Room failures (procedure throws, size limits, rejected registers) now fire `room.subscribe.error` / `useRoomError(callback)` — a callback, not a stored last error.
- 67ab7f2: Build IO with `createIO().platform(...).config({ treaty, secret })`.

    `createIO` is no longer a one-shot call. Named platform helpers only take platform options. Pass `treaty`, `secret`, and `context` to `.config()`.

    ```ts
    // Before
    const io = createIO(
        platformNode({
            authorize: { secret, user: schema },
            context: () => ({ db }),
            crdt: yjs,
        }),
    );

    // After
    const io = createIO()
        .platform(platformNode())
        .config({
            treaty,
            secret,
            context: () => ({ db }),
        });
    ```

    `platformCloudflare` follows the same split. `secret` stays on `.config()`.

    Hosted pluv is the exception on secrets: `secretKey` / `publicKey` / `basePath` stay on `platformPluv`. Omit `secret` on `.config()`. User lives on the treaty.

    ```ts
    // Before
    const io = createIO(
        platformPluv({
            authorize: { user: schema },
            context: () => ({ db }),
            crdt: yjs,
            publicKey,
            secretKey,
            basePath: "/api/pluv",
        }),
    );

    // After
    const io = createIO()
        .platform(
            platformPluv({
                publicKey,
                secretKey,
                basePath: "/api/pluv",
            }),
        )
        .config({
            treaty,
            context: () => ({ db }),
        });
    ```

- 80a5c16: Require authorization for every room connection.

    Open (unauthorized) rooms are removed: `createIO` must configure a `treaty` (and `secret` on platforms that sign JWTs), clients must provide an `authEndpoint`, and connections without a valid token are rejected. Session users are always typed from `treaty.user` (at least `{ id: string }`), not `null`.

- 1f6f749: User, presence, metadata, and event inputs all take the same validator libraries:

    - Zod 4.2+
    - ArkType

    The old Zod-like `{ parse, _input }` duck type no longer works.

- ad09444: Treaty presence and storage procedures are callable from the client room, and React hooks match that model.

    - Invoke treaty commands on `room.presence` and `room.storage` (same names as on your treaty router). Callable form also works: `room.presence("select", data)`.

    ```ts
    room.presence.select({ id: "item-1" });
    room.storage.addMessage({ text: "hello" });
    ```

    Storage procedures throw until CRDT storage is loaded. Presence procedures throw until the local user is available.

    - In React, `usePresence()` and `useStorage()` return those command proxies. Do not destructure them or you lose the bound room. Read CRDT JSON with `useStorageField(key)`. That replaces the old keyed `useStorage("messages")` pattern.

    ```ts
    const presence = usePresence();
    const storage = useStorage();
    const [messages, sharedType] = useStorageField("messages");

    presence.select({ id: "item-1" });
    storage.addMessage({ text: "hello" });
    ```

    - Optional: `createBundle(client, { suspense: true })` makes storage hooks wait until the room has loaded storage. Wrap room UI in `<Suspense>`. `useStorageField` then types as a non-null tuple instead of `[null, null]` while connecting. If the room closes or storage becomes unavailable before load, the nearest error boundary handles the rejection.

    ```tsx
    const { PluvRoomProvider, useStorageField } = createBundle(client, { suspense: true });

    <PluvRoomProvider room="room-id" initialPresence={{}} initialStorage={{ messages: [] }}>
        <Suspense fallback="Loading storage...">
            <Chat />
        </Suspense>
    </PluvRoomProvider>;
    ```

    ```ts
    const [messages, sharedType] = useStorageField("messages");
    ```

    Treaty authors: define procedures as before; resolvers receive `user`, a read-only presence snapshot (mutating it does not update the room), and for storage either writable `storage` or lazy `json` on presence procedures. Storage resolvers run inside `room.transact` by default; pass `{ transact: false }` when the resolver owns its own commit (for example Loro).

    ```ts
    const select = t.procedure.presence
        .input(z.object({ id: z.string().nullable() }))
        .resolve(({ id }, { user, presence }) => ({ selectionId: id }));

    const addMessage = t.procedure.storage
        .input(z.object({ text: z.string() }))
        .resolve(({ text }, { storage }) => {
            storage.messages.push([text]);
        });

    export const treaty = t.router({ select, addMessage });
    ```

    ```ts
    const addMessage = t.procedure.storage.input(z.object({ text: z.string() })).resolve(
        ({ text }, { storage }) => {
            storage.messages.push([text]);
        },
        { transact: false },
    );
    ```

    If you use `{ transact: false }` and commit after `resolve` returns, outbound storage updates may not include the procedure name on the wire.

- 861da09: Define user, presence, and storage once as a **treaty**, then import the same value on the server and the client.

    You no longer split schemas across `authorize.user`, `createIO({ crdt })`, and `createClient({ presence, storage })`. Optional presence/storage procedures live on the treaty and are invoked as `room.presence.select` / `room.storage.addMessage`.

    ```ts
    // shared/treaty.ts
    import { createTreaty } from "@pluv/treaty";
    import { s } from "@pluv/crdt";
    import { yjs } from "@pluv/crdt-yjs";
    import { z } from "zod";

    export const treaty = createTreaty({
        user: z.object({
            id: z.string(),
            name: z.string(),
        }),
        presence: z.object({
            selectionId: z.string().nullable(),
        }),
        storage: yjs.schema({
            messages: yjs.yArray(s.string()),
        }),
    });
    ```

    ```ts
    // Before
    const io = createIO()
        .platform(platformNode())
        .config({
            authorize: { secret, user: schema },
            context: () => ({ db }),
        });

    const client = createClient<typeof ioServer>().config({
        authEndpoint: () => "",
        presence: z.object({ selectionId: z.string().nullable() }),
        storage: yjs.storage({
            schema: yjs.schema({ messages: yjs.yArray(s.string()) }),
        }),
        initialStorage: { messages: [] },
    });

    // After
    const io = createIO()
        .platform(platformNode())
        .config({
            treaty,
            secret,
            context: () => ({ db }),
        });

    const client = createClient<typeof ioServer>().config({
        authEndpoint: () => "",
        treaty,
        initialStorage: { messages: [] },
    });
    ```

    `yjs.schema` / `loro.schema` are the storage factories (`yjs.storage` / `loro.storage` are removed). Node and Cloudflare still pass `secret` on `.config()`. Hosted `platformPluv` omits `secret` (`secretKey` stays on `platformPluv(...)`).

    Use `createClient<typeof ioServer>()` when you need server event types. `createClient().config({ treaty, ... })` still works without a server type; pass the runtime treaty so presence and storage infer correctly.

    Treaty user, presence, and client metadata must use Zod 4.2+ or ArkType (Standard Schema and Standard JSON Schema on the same object). See the standard-schema validators changeset for the full validator list.

### Patch Changes

- d10f401: Remove the unused combined `config.resolver` from procedures.

    Event handlers already run via `broadcast`, `self`, and `sync` individually; the merged resolver was never called at runtime.

- 392a989: Align built-in client event payload types with what the server already accepts.

    `$initializeSession` / `$updatePresence` presence and `$updateStorage` update may be `null`, matching runtime handling in the base protocol router.

## 5.2.3

No changes in this release.

## 5.2.2

No changes in this release.

## 5.2.1

No changes in this release.

## 5.2.0

### Minor Changes

- 6b5ee6b: Prevent room teardown from persisting an empty document over saved storage.

    - `IORoom` teardown is now atomic. A second teardown joins the one already in flight instead of re-running it and emitting `onStorageDestroyed` with a document that was already cleared.
    - `IORoom.register` now waits for an in-flight teardown, so a connection arriving mid-teardown re-initializes from storage instead of binding to the cleared document.
    - Added `isDirty()` to `CrdtDocLike`, implemented for the yjs, loro and noop documents. It reports whether a document has ever been written to, and teardown uses it to skip `onStorageDestroyed` for a document that never was. It is not the inverse of `isEmpty()`: deleting all content leaves a document dirty, so emptied storage still persists.
    - Breaking for external `CrdtDocLike` implementations: `isDirty()` is a new required member.

## 5.1.2

No changes in this release.

## 5.1.1

No changes in this release.

## 5.1.0

No changes in this release.

## 5.0.4

No changes in this release.

## 5.0.3

## 5.0.2

## 5.0.1

## 5.0.0

## 4.1.0

## 4.0.2

### Patch Changes

- e1913b3: Upgraded internal dependencies

## 4.0.1

## 4.0.0

### Major Changes

- df5c39c: Update all packages to be ESM only.

### Minor Changes

- 037074e: Migrated build process from tsup to tsdown.

### Patch Changes

- 2eb5def: Bumped dependencies.

## 3.2.2

### Patch Changes

- 8665dbe: Updated types of `createClient` so that the types inferred from `createClient` are flattened and no-longer depend on `@pluv/server`.

## 3.2.1

## 3.2.0

## 3.1.7

## 3.1.6

## 3.1.5

## 3.1.4

## 3.1.3

## 3.1.2

## 3.1.1

## 3.1.0

## 3.0.0

## 2.3.1

## 2.3.0

## 2.2.8

## 2.2.7

## 2.2.6

## 2.2.5

## 2.2.4

## 2.2.3

## 2.2.2

## 2.2.1

## 2.2.0

## 2.1.0

## 2.0.2

## 2.0.1

## 2.0.0

### Patch Changes

- 047a1d8: Moved several internal types to `@pluv/types`.

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- af94706: pluv.io is now stable and production ready!

    With this v1 release, pluv.io will now follow [semantic versioning](https://semver.org/) with more comprehensive release notes for future changes to the library.

    Checkout the [full documentation here](https://pluv.io/docs/introduction) to get started today!

## 0.44.2

## 0.44.1

## 0.44.0

## 0.43.0

## 0.42.0

## 0.41.7

## 0.41.6

## 0.41.5

## 0.41.4

## 0.41.3

## 0.41.2

## 0.41.1

## 0.41.0

## 0.40.2

## 0.40.1

## 0.40.0

## 0.39.1

## 0.39.0

## 0.38.14

## 0.38.13

## 0.38.12

## 0.38.11

## 0.38.10

## 0.38.9

## 0.38.8

## 0.38.7

## 0.38.6

## 0.38.5

## 0.38.4

## 0.38.3

## 0.38.2

## 0.38.1

## 0.38.0

### Minor Changes

- f4ceca3: Updated internal event names to follow a new naming convention.

## 0.37.7

## 0.37.6

## 0.37.5

## 0.37.4

## 0.37.3

## 0.37.2

## 0.37.1

## 0.37.0

## 0.36.0

## 0.35.4

## 0.35.3

## 0.35.2

### Patch Changes

- 81cb692: Fixed type inference of the `authorize` option in `createIO` when used as a function.

## 0.35.1

## 0.35.0

## 0.34.1

## 0.34.0

## 0.33.0

## 0.32.9

## 0.32.8

## 0.32.7

## 0.32.6

## 0.32.5

## 0.32.4

## 0.32.3

## 0.32.2

## 0.32.1

## 0.32.0

## 0.31.0

## 0.30.2

## 0.30.1

## 0.30.0

## 0.29.0

## 0.28.0

## 0.27.0

## 0.26.0

## 0.25.4

## 0.25.3

## 0.25.2

## 0.25.1

## 0.25.0

## 0.24.1

## 0.24.0

## 0.23.0

## 0.22.0

## 0.21.1

## 0.21.0

## 0.20.0

## 0.19.0

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

    const client = createClient<typeof io>({/* ... */});
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
    const client = createClient<typeof ioServer>({/* ... */});
    ```

    - `PluvRouter` instances can also be merged via the `mergeRouters` method, which effectively performs an `Object.assign` of the events object and returns a new `PluvRouter` with the correct types:

    ```ts
    const router = io.mergeRouters(router1, router2);
    ```

## 0.17.3

## 0.17.2

## 0.17.1

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

## 0.16.3

## 0.16.2

## 0.16.1

## 0.16.0

## 0.15.0

## 0.14.1

## 0.14.0

## 0.13.0

## 0.12.3

## 0.12.2

### Patch Changes

- 259a7da: Bumped dependencies

## 0.12.1

## 0.12.0

## 0.11.1

## 0.11.0

## 0.10.3

## 0.10.2

## 0.10.1

### Patch Changes

- 885835d: remove unnecessary dependency

## 0.10.0

### Minor Changes

- f43f1cc: Change packages to all be versioned together for consistency.

## 0.2.2

### Patch Changes

- 8fba48b: fix including incorrect dependency
- 8997c65: bumped dependencies

## 0.2.1

### Patch Changes

- 8d11672: bumped dependencies to latest

## 0.2.0

### Minor Changes

- bb2886b: allow sending multiple output types (broadcast, self, sync) per event
- ae679a8: updated offline presence to be set when reconnecting to a room

### Patch Changes

- 0dd847e: updated storage to be synced when reconnected to the room

## 0.1.6

### Patch Changes

- 850626e: bumped dependencies

## 0.1.5

### Patch Changes

- 74870ee: bumped dependencies

## 0.1.4

### Patch Changes

- 9516a4e: updated typescript to 5.0
- 7b6da1c: bumped dependencies
- e9c1514: bumped dependencies

## 0.1.3

### Patch Changes

- 8bf62cb: bumped dependencies
- 7e52685: Bumped dependencies
- 8e97fb2: Updated dependencies

## 0.1.2

### Patch Changes

- fe80d7b: added preview disclaimer about breaking changes in the readme

## 0.1.1

### Patch Changes

- 24016e6: Updated dependencies

## 0.1.0

### Minor Changes

- a22f525: Added documentation

# @pluv/treaty

## 6.0.0

### Major Changes

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

- Updated dependencies [4058575]
- Updated dependencies [ba6805a]
- Updated dependencies [0ee9d2d]
- Updated dependencies [d10f401]
- Updated dependencies [4058575]
- Updated dependencies [4058575]
- Updated dependencies [67ab7f2]
- Updated dependencies [80a5c16]
- Updated dependencies [392a989]
- Updated dependencies [1f6f749]
- Updated dependencies [ad09444]
- Updated dependencies [861da09]
    - @pluv/types@6.0.0
    - @pluv/crdt@6.0.0

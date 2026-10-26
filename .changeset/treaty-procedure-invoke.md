---
"@pluv/treaty": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/types": major
---

Treaty presence and storage procedures are callable from the client room, and React hooks match that model.

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

Treaty authors: define procedures as before; resolvers receive `user`, a read-only presence snapshot (mutating it does not update the room), and for storage either writable `storage` or lazy `json` on presence procedures. Storage resolvers run inside `room.transact` by default; pass `{ transact: false }` when the client resolver owns its own commit (for example Loro). The server always wraps `resolve` in a transaction.

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

`prepare` runs in the runtime that invoked the procedure. A client call loads in the browser and syncs the update. The server applies those bytes and does not run `prepare` again. A host call loads on the server. It may be async. It receives the parsed input, the user, the operator, and the presence snapshot. It does not receive the document. `resolve` stays synchronous and receives the loaded value. A client call returns before that write. A host call resolves after the write is broadcast. A failed `prepare` rejects the host call and does not write. `resolve` cannot return a promise.

```ts
const addMessage = t.procedure.storage
    .input(z.object({ text: z.string() }))
    .prepare(async ({ text }) => {
        const id = await loadId(text);

        return { id };
    })
    .resolve(({ text }, { storage }, loaded) => {
        storage.messages.push([`${loaded.id}:${text}`]);
    });

room.storage.addMessage({ text: "hello" });
```

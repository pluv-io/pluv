---
"@pluv/treaty": major
"@pluv/io": major
"@pluv/client": major
"@pluv/react": major
"@pluv/types": major
---

Call presence and storage procedures on the room. Presence resolvers receive `{ user, presence, json }`. Storage resolvers also receive writable `storage`. `presence` is a snapshot; mutating it does not update the room. `json` is computed on first access. Storage resolvers auto-transact unless you pass `{ transact: false }`. React `useStorage()` is now that command proxy; the old keyed hook is `useStorageField(key)`.

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
room.presence.select({ id: "item-1" });
room.storage.addMessage({ text: "hello" });

// Also callable:
room.presence("select", { id: "item-1" });
room.storage("addMessage", { text: "hello" });
```

Storage resolvers run inside `room.transact` by default. Opt out when the resolver should own commit (for example Loro):

```ts
const addMessage = t.procedure.storage.input(z.object({ text: z.string() })).resolve(
    ({ text }, { storage }) => {
        storage.messages.push([text]);
    },
    { transact: false },
);
```

If `transact: false` and you commit **after** `resolve` returns, `$updateStorage` will not include the procedure name.

React: `usePresence()` / `useStorage()` return those proxies. Do not destructure them. Read a CRDT field with `useStorageField`:

```ts
const presence = usePresence();
const storage = useStorage();
const [messages, sharedType] = useStorageField("messages");

presence.select({ id: "item-1" });
storage.addMessage({ text: "hello" });
```

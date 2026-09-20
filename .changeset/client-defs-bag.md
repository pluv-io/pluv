---
"@pluv/client": major
"@pluv/react": major
"@pluv/addon-indexeddb": major
---

Create clients with `createClient<typeof ioServer>().config({ ... })`.

`createClient` is no longer a one-shot call. `infer((i) => ({ io }))` and the `types` option are removed. Bind the server type as a type argument, then pass the shared `treaty` and metadata to `.config()`.

```ts
// Before
const types = infer((i) => ({ io: i<typeof ioServer> }));
const client = createClient({
    types,
    authEndpoint: () => "",
    presence: z.object({ selectionId: z.string().nullable() }),
});

// After
const client = createClient<typeof ioServer>().config({
    authEndpoint: () => "",
    treaty,
});
```

Pass options to `.config()`, not to `createClient` itself. `createClient().config({ ... })` still works when you do not have a server type.

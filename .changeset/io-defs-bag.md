---
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/platform-pluv": major
"@pluv/addon-indexeddb": major
"@pluv/crdt-yjs": major
---

Build IO with `createIO().platform(...).config({ authorize })`.

`createIO` is no longer a one-shot call. Named platform helpers only take platform options. Pass `authorize`, `context`, and `crdt` to `.config()`.

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
    authorize: { secret, user: schema },
    context: () => ({ db }),
    crdt: yjs,
  });
```

`platformCloudflare` follows the same split. `authorize.secret` stays on `.config()`.

Hosted pluv is the exception on secrets: `secretKey` / `publicKey` / `basePath` stay on `platformPluv`. `authorize` on `.config()` is JWT-less (`user` only — no `secret`).

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
    authorize: { user: schema },
    context: () => ({ db }),
    crdt: yjs,
  });
```

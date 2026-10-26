---
"@pluv/io": major
"@pluv/types": major
"@pluv/client": major
"@pluv/react": major
"@pluv/platform-node": major
"@pluv/platform-cloudflare": major
"@pluv/addon-indexeddb": major
"@pluv/crdt-yjs": major
---

Build IO with `createIO().platform(...).config({ treaty, secret })`.

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

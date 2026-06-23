---
"@pluv/platform-node": major
---

**BREAKING**: `@pluv/platform-node` init context now uses `request` instead of `req`, aligned with `@pluv/platform-cloudflare`.

- `room.register` and `io.createToken` now take `{ request: Request | IncomingMessage }` instead of `{ req: IncomingMessage }`.
- Function-form `authorize` receives `{ request: Request }` — `IncomingMessage` values are normalized automatically.
- Optional `platformNode({ origin })` sets the base URL when converting `IncomingMessage` to `Request`.

```ts
// Before
await room.register(ws, { req, token });
await io.createToken({ req, room, user });
authorize: ({ req }) => ({ ... });

// After
await room.register(ws, { request: req, token });
await io.createToken({ request: c.req.raw, room, user });
authorize: ({ request }) => ({ ... });
```

See the v5 migration guide for details.
